import type { WritingAttribution, WritingContent, WritingKind, WritingSource, WritingState } from "./writing-model.js";

export type ExistingWritingAnswer = {
  questionId: string;
  answer: string;
  question?: string;
  kind?: string;
  source?: string;
  target?: string;
  answeredAt?: string;
};
export type WritingCompatibilityLink = { owner: string; questionId: string; entryId: string };
export type WritingEvidenceRef = {
  owner: string;
  sourceSystem: "writing" | "existing";
  sourceType: string;
  sourceId: string;
  versionId: string;
  capturedAt?: string;
};
export type CompatibleWritingSource = {
  owner: string;
  sourceSystem: "writing" | "existing";
  id: string;
  versionId: string;
  kind: WritingKind;
  content: WritingContent;
  attribution: WritingAttribution | { day: null; timeZone: null; occurrenceAt: null };
  startedAt: string | null;
  lastRecordedAt: string | null;
  source: WritingSource;
  aliases: Array<{ sourceId: string; sourceType: string }>;
  provenance: { answers: ExistingWritingAnswer[] } | null;
};
type DeepReadonly<T> = T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } : T;
declare const view: unique symbol;
export type WritingCompatibilityView = DeepReadonly<{
  readonly [view]: true;
  owner: string;
  sources: CompatibleWritingSource[];
  answeredQuestions: Array<{ questionId: string; question: string | null }>;
  hasSavedWriting: { note: boolean; thoughts: boolean };
  usageKnown: boolean;
  questionHistoryKnown: boolean;
  lastAnsweredQuestion: { questionId: string; question: string | null; answeredAt: string } | null;
}>;
export function buildWritingCompatibilityView(input: {
  owner: string;
  writingState: WritingState;
  existingWriting?: { owner: string; answers: ExistingWritingAnswer[] } | null;
  links?: WritingCompatibilityLink[];
}): Promise<WritingCompatibilityView>;

export type WritingMemoryItem = { id: string; sourceRefs?: unknown[]; status?: string; [key: string]: unknown };
export type WritingMemoryCollection = "ledger" | "tastes" | "rhythms" | "portrait" | "curiosity";
/** Stored input may contain incomplete items; runtime selection validates them. */
export type WritingMemorySnapshot = Partial<Record<WritingMemoryCollection, Array<Record<string, unknown>>>> & {
  corrections?: Array<{ action?: string; sourceId?: string; targetId?: string; owner?: string; sourceSystem?: string; [key: string]: unknown }>;
  reading?: unknown;
  editions?: unknown[];
};
export function writingConsumerMemory(input: { owner: string; memory: WritingMemorySnapshot }, view: WritingCompatibilityView | null): WritingMemorySnapshot;
export function selectWritingMemory(input: { owner: string; memory: WritingMemorySnapshot }, view: WritingCompatibilityView): {
  owner: string;
  context: Record<WritingMemoryCollection, WritingMemoryItem[]>;
  excluded: Array<{ collection: WritingMemoryCollection; id: string | null; reason: string }>;
  readings: { reading: unknown; editions: unknown[] };
};
