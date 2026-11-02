export const WRITING_SCHEMA_VERSION: 1;
export type WritingKind = "note" | "thought" | "deep-thought" | "reading-answer";
export type WritingAttribution = { day: string; timeZone: string; occurrenceAt: string | null };
export type WritingContent = { title: string; body: string; tags: string[] };
export type WritingSource = {
  questionId?: string;
  question?: string;
  source?: string;
  readingId?: string;
  editionId?: string;
} | null;
export type WritingBase = { baseVersionId: string | null; baseGeneration: number };
export type WritingDraftInput = WritingBase & {
  id: string;
  entryId: string;
  kind: WritingKind;
  startedAt: string;
  attribution: WritingAttribution;
  content: WritingContent;
  source: WritingSource;
};
export type WritingDraft = Omit<WritingDraftInput, "content"> & {
  version: number;
  status: "active" | "saved" | "discarded";
  content: WritingContent | null;
  updatedAt: string;
  /** Rebase only the same editor's edits across its own earlier Save. */
  savedFrom?: WritingBase;
};
export type WritingSaveSnapshot = WritingDraftInput & { version: number };
export type WritingVersion = {
  id: string;
  sequence: number;
  content: WritingContent;
  attribution: WritingAttribution;
  savedAt: string;
};
export type WritingEntry = {
  id: string;
  kind: WritingKind;
  source: WritingSource;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "trashed";
  generation: number;
  currentVersionId: string;
  versions: WritingVersion[];
};
type OperationHeader = { owner: string; operationId: string; at: string };
export type WritingCommand = OperationHeader & (
  | { type: "write-draft"; draft: WritingDraftInput; expectedDraftVersion: number }
  | { type: "save"; draft: WritingSaveSnapshot }
  | { type: "discard-draft"; draftId: string; expectedDraftVersion: number }
  | { type: "trash" | "restore"; entryId: string; expectedGeneration: number }
  | { type: "delete"; entryId: string; expectedGeneration: number; confirmed: true }
);
declare const prepared: unique symbol;
export type PreparedWritingOperation = {
  readonly [prepared]: true;
  readonly command: Readonly<WritingCommand>;
  readonly fingerprint: string;
};
export type WritingReceipt = {
  operationId: string;
  fingerprint: string;
  entryId: string;
  outcome: "drafted" | "saved" | "unchanged" | "discarded" | "conflict" | "trashed" | "restored" | "deleted";
  at: string;
  versionId: string | null;
  generation: number;
  draftId: string | null;
  draftVersion: number | null;
};
export type WritingState = {
  schemaVersion: 1;
  owner: string;
  entries: Record<string, WritingEntry>;
  drafts: Record<string, WritingDraft>;
  receipts: Record<string, WritingReceipt>;
  tombstones: Record<string, {
    id: string; generation: number; deletedAt: string;
    /** Absent on older deletion markers; never reconstruct missing history. */
    usage?: { kind: WritingKind; answeredAt: string; questionId?: string; question?: string };
  }>;
};
export type WritingResult = { state: WritingState; receipt: WritingReceipt };
export type WritingHistoryEntry = Omit<WritingEntry, "versions" | "currentVersionId"> & {
  versionId: string;
  content: WritingContent;
  attribution: WritingAttribution;
  title: string | null;
};
export class WritingError extends Error { code: string; constructor(code: string, message: string); }
/** UTC ISO instants must be supplied explicitly; an unsupported timezone fails rather than guessing. */
export function writingAttribution(at: string, timeZone: string): WritingAttribution;
export function createWritingState(owner: string): WritingState;
export function assertWritingState(state: unknown, owner?: string): WritingState;
/** Use before opening a database transaction; keeps retry identity separate from mutable caller objects. */
export function prepareWritingOperation(command: WritingCommand): Promise<PreparedWritingOperation>;
export function applyWritingOperation(state: WritingState, operation: PreparedWritingOperation): WritingResult;
export function writingDrafts(state: WritingState): Array<WritingDraft & { content: WritingContent }>;
export function writingHistory(state: WritingState, options?: { status?: "active" | "trashed"; kind?: WritingKind; day?: string }): WritingHistoryEntry[];
export function writingVersions(state: WritingState, entryId: string): WritingVersion[];
export function writingEvidence(state: WritingState): Array<Pick<WritingHistoryEntry, "id" | "kind" | "versionId" | "content" | "attribution" | "source">>;
