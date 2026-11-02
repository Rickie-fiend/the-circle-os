import { accountStorageKey, assertAccountScope, isAccountScopeCurrent, scopedTransaction, type AccountScope } from "./account-scope";
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
const CHANGE_EVENT = "circle-os-writing-change";

function changeKey(scope: AccountScope) {
  return accountStorageKey(scope, `${WRITING_DATABASE_NAME}:change`);
}

/** Notifications contain an owner/change token only, never writing or drafts. */
function announceWritingChange(scope: AccountScope) {
  assertAccountScope(scope);
  const key = changeKey(scope);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
  try {
    const channel = new BroadcastChannel(key);
    channel.postMessage("changed");
    channel.close();
  } catch { /* storage events and foreground reads remain available */ }
  try { localStorage.setItem(key, crypto.randomUUID()); }
  catch { /* A notification failure cannot undo an already committed write. */ }
}

export function subscribeWritingChanges(scope: AccountScope, listener: () => void) {
  const key = changeKey(scope);
  const notify = () => { if (isAccountScopeCurrent(scope)) listener(); };
  const local = (event: Event) => { if ((event as CustomEvent).detail === key) notify(); };
  const storage = (event: StorageEvent) => { if (event.key === key || event.key === null) notify(); };
  const visible = () => { if (document.visibilityState === "visible") notify(); };
  let channel: BroadcastChannel | null = null;
  try { channel = new BroadcastChannel(key); channel.onmessage = notify; }
  catch { /* local/storage/foreground notifications still work */ }
  window.addEventListener(CHANGE_EVENT, local);
  window.addEventListener("storage", storage);
  window.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", visible);
  return () => {
    channel?.close();
    window.removeEventListener(CHANGE_EVENT, local);
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", visible);
  };
}

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
  const result = await scopedTransaction<WritingResult>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readwrite",
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
  assertAccountScope(scope);
  announceWritingChange(scope);
  return result;
}
