import type {
  AppTarget,
  ChapterDefinition,
  ChapterKind,
  ChapterRun,
} from "./chapter-types";

export const CHAPTER_KINDS: readonly ChapterKind[];
export const HOURLY_CHAPTER_BUDGET: number;
export function hourKey(value?: Date | string): string;
export function millisecondsUntilNextHour(now?: Date): number;
export function countChaptersStartedInHour(
  chapters: ChapterDefinition[],
  runs?: Record<string, ChapterRun>,
  now?: Date,
): { hour: number; probesToday: number };
export const DAILY_PROBE_BUDGET: number;

export type ChapterFacts = {
  loggedDays: number;
  hasVision: boolean;
  habitStreakBroken: boolean;
  weekday: number;
};

export type ChapterScheduleContext = {
  now?: Date;
  facts?: Partial<ChapterFacts>;
  app?: AppTarget;
};

export function chapterKind(chapter: ChapterDefinition): ChapterKind;
export function chapterApp(chapter: ChapterDefinition): AppTarget;
export function chapterWeight(chapter: ChapterDefinition): number;

export function latestChapterVersions(
  chapters: ChapterDefinition[],
): ChapterDefinition[];

export function chapterFacts(state: unknown, now?: Date): ChapterFacts;

export function chapterBlockReason(
  chapter: ChapterDefinition | undefined,
  context?: { now?: Date; run?: ChapterRun; facts?: Partial<ChapterFacts> },
): string;

export function countChaptersStartedOn(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  dateKey: string,
): { total: number; probes: number };

export function scheduleChapters(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  context?: ChapterScheduleContext,
): ChapterDefinition[];

export function selectScheduledChapter(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  context?: ChapterScheduleContext,
): ChapterDefinition | undefined;

export function chapterDeckSignal(
  chapters: ChapterDefinition[],
  runs: Record<string, ChapterRun>,
  context?: ChapterScheduleContext,
): {
  count: number;
  hasFresh: boolean;
  next: ChapterDefinition | undefined;
};
