import type { ChapterDefinition, ChapterRun } from "./chapters/chapter-types";

export type QuestStep = {
  chapterId: string;
  minutes?: number;
};

export type Quest = {
  id: string;
  topic: string;
  title: string;
  blurb: string;
  steps: QuestStep[];
};

export type QuestStepView = {
  chapterId: string;
  minutes: number;
  title: string;
  session: string;
  done: boolean;
  alreadySetUp: boolean;
  runId: string | null;
};

export type QuestView = {
  id: string;
  topic: string;
  title: string;
  blurb: string;
  steps: QuestStepView[];
  done: number;
  total: number;
  minutes: number;
  started: boolean;
  complete: boolean;
  next: QuestStepView | null;
};

type GetChapter = (id: string) => ChapterDefinition | undefined;
type QuestContext = { state?: import("./circle-os-shell").CircleState; publications?: import("./chapters/chapter-publication-store").StoredChapterPublication[] };
export function questStepStatus(chapterId: string, runs: Record<string, ChapterRun>, context?: QuestContext): { done: boolean; alreadySetUp: boolean; runId: string | null };

export function questTopics(quests: Quest[]): string[];

export function findQuest(quests: Quest[], id: string): Quest | null;

export function questProgress(
  quest: Quest,
  runs: Record<string, ChapterRun>,
  getChapter: GetChapter,
  context?: QuestContext,
): QuestView;

export function questCatalogue(
  quests: Quest[],
  runs: Record<string, ChapterRun>,
  getChapter: GetChapter,
  context?: QuestContext,
): QuestView[];
