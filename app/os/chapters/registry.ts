import published from "./published/index.json";
import type { ChapterDefinition } from "./chapter-types";

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

export const publishedChapters: ChapterDefinition[] = (
  published.chapters as unknown[]
).filter(isChapter);

export function getPublishedChapter(id: string, version?: number) {
  return publishedChapters
    .filter((chapter) => chapter.id === id && (!version || chapter.version === version))
    .sort((left, right) => right.version - left.version)[0];
}
