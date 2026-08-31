import type {
  ChapterAnswer,
  ChapterDefinition,
  ChapterRun,
  ChapterSubmission,
} from "./chapter-types";

export function chapterRunId(chapter: ChapterDefinition): string;

export function chapterEverCompleted(
  runs: Record<string, ChapterRun>,
  chapterId: string,
): boolean;

export function createChapterRun(
  chapter: ChapterDefinition,
  seedAnswers?: ChapterAnswer[],
): ChapterRun;

export function findChapterAnswer(
  run: ChapterRun,
  answerKey: string,
): ChapterAnswer | undefined;

export function chapterAnswerText(
  run: ChapterRun,
  answerKey: string,
): string;

export function renderChapterTemplate(
  value: string | undefined,
  run: ChapterRun,
): string;

export function selectHourlyChapter(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  nowValue?: Date | string | number,
): ChapterDefinition | undefined;

export function selectManualChapter(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  currentChapterId?: string,
):
  | {
      chapter: ChapterDefinition;
      repeat: boolean;
    }
  | undefined;

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
  outbox: Array<{
    id: string;
    reason: string;
    message?: string;
    createdAt: string;
  }>;
}>(
  state: T,
  run: ChapterRun,
  session: string,
): T;
