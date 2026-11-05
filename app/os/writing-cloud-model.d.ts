import type { WritingEntry, WritingState } from "./writing-model.js";
import type { WritingSyncState, WritingSyncAcknowledgement } from "./writing-sync-model.js";
export type WritingSnapshot = { entry: WritingEntry | null; tombstone: WritingState["tombstones"][string] | null };
export type WritingHead = { owner: string; entryId: string; serverVersion: number; snapshot: WritingSnapshot };
export type WritingCloudState = {
  schemaVersion: 1; owner: string;
  heads: Record<string, { serverVersion: number; signature: string }>;
  conflicts: Record<string, WritingHead>;
  suppressed: Record<string, { entryId: string; fingerprint: string }>;
};
export type WritingCloudBundle = { state: WritingState; queue: WritingSyncState; cloud: WritingCloudState };
export type WritingUpload = {
  requestId: string; entryId: string; baseServerVersion: number; snapshot: WritingSnapshot;
  changes: Array<{ operationId: string; fingerprint: string; generation: number }>;
};
export function canonicalWriting(value: unknown): string;
export function writingDigest(value: unknown): Promise<string>;
export function createWritingCloudState(owner: string): WritingCloudState;
export function assertWritingCloudState(cloud: unknown, owner?: string): WritingCloudState;
export function writingSnapshot(state: WritingState, entryId: string): WritingSnapshot;
export function assertWritingHead(head: unknown, owner: string): WritingHead;
export function inventoryWritingChanges(state: WritingState, queue: WritingSyncState, cloud: WritingCloudState): Promise<WritingSyncState>;
export function receiveWritingHeads(bundle: WritingCloudBundle, heads: WritingHead[], forceConflict?: boolean): WritingCloudBundle;
export function writingUploadRequests(bundle: WritingCloudBundle): Promise<WritingUpload[]>;
export function receiveWritingReceipts(bundle: WritingCloudBundle, receipts: WritingSyncAcknowledgement[]): WritingCloudBundle;
export function receiveWritingUpload(bundle: WritingCloudBundle, request: WritingUpload, receipts: WritingSyncAcknowledgement[]): WritingCloudBundle;
