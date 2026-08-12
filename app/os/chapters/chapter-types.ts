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

// What a chapter is for. The mix is the point: mostly sparks, so that the rare
// probe is answered properly instead of skipped.
export type ChapterKind =
  | "spark"
  | "check-in"
  | "mirror"
  | "lesson"
  | "probe"
  | "debate";

export type ChapterVoice = "athena" | "oscar";

// Conditions the phone can check offline, with no reading of its own. Athena
// attaches them when she writes the chapter; the device only does arithmetic.
export type ChapterRequirement = {
  minLoggedDays?: number;
  maxLoggedDays?: number;
  hasVision?: boolean;
  habitStreakBroken?: boolean;
  weekdays?: number[];
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
  showPageNumbers?: boolean;
  kind?: ChapterKind;
  app?: AppTarget;
  voice?: ChapterVoice;
  weight?: number;
  earliestAt?: string;
  expiresAt?: string;
  cooldownDays?: number;
  requires?: ChapterRequirement;
  pages: ChapterPage[];
};

export type AppTarget =
  | "note"
  | "thoughts"
  | "deep-thoughts"
  | "habit"
  | "protocol"
  | "log"
  | "vision"
  | "seven-days"
  | "athena";

export type ChapterPublication = {
  chapter: ChapterDefinition;
  targetApp: AppTarget;
  audienceProfileId: string;
  visibility: "private" | "public";
  delivery: "manual" | "on-view";
  source: "admin" | "athena";
  publishedAt: string;
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
  deferCount?: number;
  deferredAt?: string | null;
  dismissedAt?: string | null;
  answers: ChapterAnswer[];
};

export type ChapterSubmission = {
  page: ChapterPage;
  value?: ChapterAnswerValue;
  displaySnapshot?: string;
};
