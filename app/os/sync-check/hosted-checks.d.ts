import type { WritingRemote } from "../writing-cloud-sync.js";
export type TestWitness = { owner: string; entryId: string; operationIds: string[]; serverVersion: number;
  archive: { requestId: string; serverVersion: number } };
export function validateWitness(value: unknown): TestWitness;
export function runHostedChecks(options: {
  owner: string; remote: WritingRemote; witness?: TestWitness; report?: (line: string) => void;
}): Promise<TestWitness>;
export function verifyOwnWitness(remote: WritingRemote, witness: TestWitness, owner: string, other?: TestWitness): Promise<void>;
