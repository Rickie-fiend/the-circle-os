export type ChapterTheme = "light" | "orange" | "dark";

export type ChapterPageType =
  | "cover"
  | "info"
  | "single-choice"
  | "multi-choice"
  | "yes-no"
  | "slider"
  | "short-text"
  | "long-text"
  | "time"
  | "confirm"
  | "result"
  | "idle";

export type ChapterOption = {
  id: string;
  label: string;
};

export type ChapterPage = {
  id: string;
  type: ChapterPageType;
  title?: string;
  body?: string;
  question?: string;
  button?: string;
  answerKey?: string;
  placeholder?: string;
  options?: ChapterOption[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  defaultValue?: string | number | string[];
  required?: boolean;
};

export type ChapterDefinition = {
  schemaVersion: 1;
  id: string;
  version: number;
  status: "published";
  session: string;
  theme: ChapterTheme;
  title: string;
  purpose: string;
  estimatedMinutes: number;
  pages: ChapterPage[];
};

export type ChapterAnswerValue = string | number | string[] | boolean;

export type ChapterAnswer = {
  pageId: string;
  answerKey: string;
  questionSnapshot?: string;
  value: ChapterAnswerValue;
  displaySnapshot: string;
  answeredAt: string;
  changedAt: string;
};

export type ChapterRun = {
  runId: string;
  chapterId: string;
  chapterVersion: number;
  status: "not-started" | "in-progress" | "completed";
  currentPageId: string;
  furthestPageId: string;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  answers: ChapterAnswer[];
};

export type ChapterSubmission = {
  page: ChapterPage;
  value?: ChapterAnswerValue;
  displaySnapshot?: string;
};
