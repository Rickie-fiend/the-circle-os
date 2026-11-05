import type { WritingCloudBundle, WritingHead, WritingUpload } from "./writing-cloud-model.js";
import type { WritingSyncAcknowledgement } from "./writing-sync-model.js";
export type WritingRemote = {
  receipts(ids: string[]): Promise<WritingSyncAcknowledgement[]>;
  inventory(cursor: string): Promise<WritingHead[]>;
  apply(request: WritingUpload): Promise<{ status: "accepted"; receipts: WritingSyncAcknowledgement[] } |
    { status: "conflict" | "deleted"; head: WritingHead }>;
};
export function syncAccountWriting(options: {
  store: { read(): Promise<WritingCloudBundle>; inventory(): Promise<WritingCloudBundle>;
    update(transform: (bundle: WritingCloudBundle) => WritingCloudBundle): Promise<WritingCloudBundle> };
  remote: WritingRemote; current?: () => boolean;
}): Promise<{ pending: number; conflicts: number }>;
