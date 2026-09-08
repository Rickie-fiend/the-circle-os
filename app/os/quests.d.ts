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

export const QUESTS: Quest[];

export function questTopics(): string[];

export function findQuest(id: string): Quest | null;

export function questProgress(
  quest: Quest,
  runs: Record<string, ChapterRun>,
  getChapter: GetChapter,
): QuestView;

export function questCatalogue(
  runs: Record<string, ChapterRun>,
  getChapter: GetChapter,
): QuestView[];
