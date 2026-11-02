import { assertAccountScope, scopedTransaction, type AccountScope } from "./account-scope";
import {
  applyWritingOperation,
  assertWritingState,
  createWritingState,
  prepareWritingOperation,
  WritingError,
  type WritingCommand,
  type WritingResult,
  type WritingState,
} from "./writing-model.js";

export const WRITING_DATABASE_NAME = "circle-os-writing-v1";
const STORE_NAME = "writing";
const STATE_KEY = "records";

export function writingOwner(scope: AccountScope): string {
  assertAccountScope(scope);
  return scope.kind === "account" ? `account:${scope.accountId}` : "legacy";
}

function storedState(value: unknown, owner: string): WritingState {
  return value === undefined ? createWritingState(owner) : assertWritingState(value, owner);
}

function error(value: unknown): Error {
  return value instanceof Error ? value : new Error("Local writing could not be saved.");
}

export async function loadWritingState(scope: AccountScope): Promise<WritingState> {
  const owner = writingOwner(scope);
  return scopedTransaction<WritingState>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readonly",
    database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const request = store.get(STATE_KEY);
      request.onsuccess = () => {
        try { complete(storedState(request.result, owner)); }
        catch (cause) { fail(error(cause)); }
      };
    });
}

/** Read/check/write the latest ledger inside ONE transaction, including across tabs.
 * A receipt is local acceptance only. It is not a Supabase/cloud acknowledgement.
 * No localStorage fallback, upload, automatic expiry, or existing-profile import.
 */
export async function commitWritingOperation(scope: AccountScope, command: WritingCommand): Promise<WritingResult> {
  const owner = writingOwner(scope);
  if (command.owner !== owner) throw new WritingError("owner-mismatch", "This writing belongs to another account.");
  // Hashing may yield; recheck the captured scope afterwards, never select a new owner.
  const prepared = await prepareWritingOperation(command);
  assertAccountScope(scope);
  return scopedTransaction<WritingResult>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readwrite",
    database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const request = store.get(STATE_KEY);
      request.onsuccess = () => {
        try {
          const result = applyWritingOperation(storedState(request.result, owner), prepared);
          store.put(result.state, STATE_KEY);
          // scopedTransaction resolves only on transaction.oncomplete, not request success.
          complete(result);
        } catch (cause) { fail(error(cause)); }
      };
    });
}
