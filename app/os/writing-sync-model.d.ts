import type { WritingResult, WritingState } from "./writing-model.js";
export type WritingSyncChange = {
  owner: string;
  operationId: string;
  fingerprint: string;
  entryId: string;
  generation: number;
  versionId: string | null;
  kind: "saved" | "trashed" | "restored" | "deleted";
  sequence: number;
  previousOperationId: string | null;
  recordedAt: string;
};
export type WritingSyncAcknowledgement = {
  owner: string;
  operationId: string;
  fingerprint: string;
  entryId: string;
  generation: number;
  receiptId: string;
  serverVersion: number;
};
export type WritingSyncState = {
  schemaVersion: 1;
  owner: string;
  nextSequence: number;
  pending: Record<string, WritingSyncChange>;
  acknowledgements: Record<string, WritingSyncAcknowledgement & { sequence: number }>;
};
export function createWritingSyncState(owner: string): WritingSyncState;
export function assertWritingSyncState(state: unknown, owner?: string): WritingSyncState;
export function enqueueWritingChange(queue: WritingSyncState, before: WritingState, result: WritingResult): WritingSyncState;
export function pendingWritingChanges(queue: WritingSyncState): WritingSyncChange[];
export function acknowledgeWritingChanges(queue: WritingSyncState, receipts: WritingSyncAcknowledgement[]): WritingSyncState;
