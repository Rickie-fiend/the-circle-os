import type { ChapterDefinition } from "./chapter-types";

export type ChapterCompletionMode = "dwell" | "swipe";
export type ResolvedChapterCompletion = ChapterCompletionMode | "submit";

export const CHAPTER_COMPLETION_MODES: readonly ChapterCompletionMode[];

export function chapterCompletion(
  chapter: Pick<ChapterDefinition, "id" | "version" | "completion" | "pages">,
): ResolvedChapterCompletion;
