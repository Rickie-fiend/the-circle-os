import published from "./published/index.json";
import sparks from "./published/sparks.json";
import type { ChapterDefinition } from "./chapter-types";
import { assertPublishedChapterRouting } from "./chapter-registry-check.js";

const PAGE_TYPES = new Set([
  "cover",
  "info",
  "single-choice",
  "multi-choice",
  "yes-no",
  "slider",
  "short-text",
  "long-text",
  "time",
  "confirm",
  "result",
  "idle",
]);

function isChapter(value: unknown): value is ChapterDefinition {
  if (!value || typeof value !== "object") return false;
  const chapter = value as ChapterDefinition;
  return Boolean(
    chapter.schemaVersion === 1 &&
      chapter.status === "published" &&
      chapter.id &&
      Number.isInteger(chapter.version) &&
      chapter.version > 0 &&
      chapter.session &&
      chapter.title &&
      Array.isArray(chapter.pages) &&
      chapter.pages.length >= 2 &&
      chapter.pages[0]?.type === "cover" &&
      new Set(chapter.pages.map((page) => page.id)).size ===
        chapter.pages.length &&
      chapter.pages.every((page) => page.id && PAGE_TYPES.has(page.type)),
  );
}

// The compiler owns index.json. The spark pack is hand-written and committed
// beside it: it is the evergreen floor, so the app always has something to give
// even when the nightly deck is empty or the server has been down for a week.
export const publishedChapters: ChapterDefinition[] = assertPublishedChapterRouting([
  ...(published.chapters as unknown[]),
  ...(sparks.chapters as unknown[]),
].map((chapter, index) => {
  if (!isChapter(chapter)) {
    throw new Error(`Published chapter registry entry ${index + 1} is malformed.`);
  }
  return chapter;
}));

export function getPublishedChapter(id: string, version?: number) {
  return publishedChapters
    .filter((chapter) => chapter.id === id && (!version || chapter.version === version))
    .sort((left, right) => right.version - left.version)[0];
}
