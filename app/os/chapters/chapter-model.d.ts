import type {
  ChapterAnswer,
  ChapterDefinition,
  ChapterRun,
  ChapterSubmission,
} from "./chapter-types";

export function chapterRunId(chapter: ChapterDefinition): string;

export function createChapterRun(
  chapter: ChapterDefinition,
  seedAnswers?: ChapterAnswer[],
): ChapterRun;

export function findChapterAnswer(
  run: ChapterRun,
  answerKey: string,
): ChapterAnswer | undefined;

export function moveChapterRun(
  chapter: ChapterDefinition,
  run: ChapterRun,
  pageId: string,
): ChapterRun;

export function advanceChapterRun(
  chapter: ChapterDefinition,
  run: ChapterRun,
  submission: ChapterSubmission,
): ChapterRun;

export function storeChapterRun<T extends {
  chapters: {
    runs: Record<string, ChapterRun>;
    sessions: Record<string, unknown>;
  };
}>(
  state: T,
  run: ChapterRun,
  session: string,
): T;
