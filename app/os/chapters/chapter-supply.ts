import { chapterApp } from "./chapter-scheduler.js";
import { chapterPublicationKey } from "./chapter-publication-store";
import { publishedChapters } from "./registry";
import type { StoredChapterPublication } from "./chapter-publication-store";
import type { ChapterDefinition } from "./chapter-types";

// Chapters shipped in the build have no publish moment of their own. A fixed
// past date keeps a finished run finished: were this "now", every reload would
// look newer than the run and re-offer a chapter the person already answered.
// A genuinely new built-in chapter still appears, because it has no run yet.
export const BUILT_IN_PUBLISHED_AT = "2020-01-01T00:00:00.000Z";

function builtInPublication(
  chapter: ChapterDefinition,
): StoredChapterPublication {
  const targetApp = chapterApp(chapter);
  return {
    key: chapterPublicationKey(chapter, "public", targetApp, "local"),
    chapter,
    targetApp,
    audienceProfileId: "local",
    visibility: "public",
    delivery: "on-view",
    source: "built-in",
    publishedAt: BUILT_IN_PUBLISHED_AT,
  };
}

export const builtInPublications: StoredChapterPublication[] =
  publishedChapters.map(builtInPublication);

// Until now nothing put the build's chapter library in front of the person:
// the only writer was the admin studio, into IndexedDB on whichever device did
// the publishing. Anything Athena or the studio publishes still wins, because a
// real publication carries a real date and its own audience.
export function mergeChapterSupply(
  stored: StoredChapterPublication[],
): StoredChapterPublication[] {
  const storedVersions = new Set(
    stored.map(
      (publication) =>
        `${publication.chapter?.id}@${publication.chapter?.version}`,
    ),
  );
  return [
    ...stored,
    ...builtInPublications.filter(
      (publication) =>
        !storedVersions.has(
          `${publication.chapter.id}@${publication.chapter.version}`,
        ),
    ),
  ];
}
