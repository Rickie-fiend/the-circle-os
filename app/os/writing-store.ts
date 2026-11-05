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
import {
  acknowledgeWritingChanges, assertWritingSyncState, createWritingSyncState, enqueueWritingChange,
  type WritingSyncState, type WritingSyncAcknowledgement,
} from "./writing-sync-model.js";
import { assertWritingCloudState, canonicalWriting, createWritingCloudState,
  inventoryWritingChanges, type WritingCloudBundle } from "./writing-cloud-model.js";

export const WRITING_DATABASE_NAME = "circle-os-writing-v1";
const STORE_NAME = "writing";
const STATE_KEY = "records";
const SYNC_KEY = "sync-v1";
const CLOUD_KEY = "cloud-v1";
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

function storedSync(value: unknown, owner: string): WritingSyncState {
  return value === undefined ? createWritingSyncState(owner) : assertWritingSyncState(value, owner);
}

/** Queue inspection is local only; neither this nor an ack makes a request. */
export async function loadWritingSyncState(scope: AccountScope): Promise<WritingSyncState> {
  const owner = writingOwner(scope);
  if (scope.kind !== "account") throw new WritingError("owner-mismatch", "Sync requires an account.");
  return scopedTransaction<WritingSyncState>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readonly",
    database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const request = store.get(SYNC_KEY);
      request.onsuccess = () => {
        if (!isAccountScopeCurrent(scope)) return;
        try { complete(storedSync(request.result, owner)); } catch (cause) { fail(error(cause)); }
      };
    });
}

export async function acknowledgeWritingSync(scope: AccountScope, receipts: WritingSyncAcknowledgement[]): Promise<WritingSyncState> {
  const owner = writingOwner(scope);
  if (scope.kind !== "account") throw new WritingError("owner-mismatch", "Sync requires an account.");
  // Capture caller-owned input before yielding to IndexedDB/account changes.
  const captured = structuredClone(receipts);
  return scopedTransaction<WritingSyncState>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readwrite",
    database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const request = store.get(SYNC_KEY);
      request.onsuccess = () => {
        if (!isAccountScopeCurrent(scope)) return;
        try {
          const next = acknowledgeWritingChanges(storedSync(request.result, owner), captured);
          store.put(next, SYNC_KEY);
          complete(next);
        } catch (cause) { fail(error(cause)); }
      };
    });
}

export async function loadWritingState(scope: AccountScope): Promise<WritingState> {
  const owner = writingOwner(scope);
  return scopedTransaction<WritingState>(scope, WRITING_DATABASE_NAME, STORE_NAME, "readonly",
    database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const request = store.get(STATE_KEY);
      request.onsuccess = () => {
        if (!isAccountScopeCurrent(scope)) return;
        try { complete(storedState(request.result, owner)); }
        catch (cause) { fail(error(cause)); }
      };
    });
}

/** Ledger, pending work and remote baselines share the same account transaction. */
export async function writingCloudTransaction(scope: AccountScope,
  update?: (bundle: WritingCloudBundle) => WritingCloudBundle): Promise<WritingCloudBundle> {
  const owner = writingOwner(scope);
  if (scope.kind !== "account") throw new WritingError("owner-mismatch", "Sync requires an account.");
  const result = await scopedTransaction<WritingCloudBundle>(scope, WRITING_DATABASE_NAME, STORE_NAME,
    update ? "readwrite" : "readonly", database => { database.createObjectStore(STORE_NAME); },
    (store, complete, fail) => {
      const ledger = store.get(STATE_KEY), pending = store.get(SYNC_KEY), remote = store.get(CLOUD_KEY);
      let count = 0;
      const ready = () => {
        if (!isAccountScopeCurrent(scope) || ++count < 3) return;
        try {
          let bundle: WritingCloudBundle = { state: storedState(ledger.result, owner), queue: storedSync(pending.result, owner),
            cloud: remote.result === undefined ? createWritingCloudState(owner) : assertWritingCloudState(remote.result, owner) };
          if (update) {
            bundle = update(bundle);
            assertWritingState(bundle.state, owner); assertWritingSyncState(bundle.queue, owner); assertWritingCloudState(bundle.cloud, owner);
            store.put(bundle.state, STATE_KEY); store.put(bundle.queue, SYNC_KEY); store.put(bundle.cloud, CLOUD_KEY);
          }
          complete(bundle);
        } catch (cause) { fail(error(cause)); }
      };
      ledger.onsuccess = ready; pending.onsuccess = ready; remote.onsuccess = ready;
    });
  if (update) announceWritingChange(scope);
  return result;
}

export async function inventoryWritingStore(scope: AccountScope): Promise<WritingCloudBundle> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = await writingCloudTransaction(scope);
    const queue = await inventoryWritingChanges(before.state, before.queue, before.cloud);
    let applied = false;
    const result = await writingCloudTransaction(scope, current => {
      if (canonicalWriting(current) !== canonicalWriting(before)) return current;
      applied = true;
      return { ...current, queue };
    });
    if (applied) return result;
  }
  throw new WritingError("sync-busy", "Your writing changed during sync. It is safe to retry.");
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
        if (!isAccountScopeCurrent(scope)) return;
        try {
          const before = storedState(request.result, owner);
          const result = applyWritingOperation(before, prepared);
          if (scope.kind === "account") {
            const sync = store.get(SYNC_KEY);
            sync.onsuccess = () => {
              if (!isAccountScopeCurrent(scope)) return;
              try {
                const queue = enqueueWritingChange(storedSync(sync.result, owner), before, result);
                const cloud = store.get(CLOUD_KEY);
                cloud.onsuccess = () => {
                  if (!isAccountScopeCurrent(scope)) return;
                  try {
                    if (cloud.result !== undefined && result.receipt.outcome === "deleted") {
                      const next = structuredClone(assertWritingCloudState(cloud.result, owner));
                      delete next.conflicts[result.receipt.entryId];
                      store.put(next, CLOUD_KEY);
                    }
                    store.put(result.state, STATE_KEY);
                    store.put(queue, SYNC_KEY);
                    complete(result);
                  } catch (cause) { fail(error(cause)); }
                };
              } catch (cause) { fail(error(cause)); }
            };
          } else {
            store.put(result.state, STATE_KEY);
            complete(result);
          }
          // Success is returned only after BOTH writes commit, including across tabs.
        } catch (cause) { fail(error(cause)); }
      };
    });
  assertAccountScope(scope);
  announceWritingChange(scope);
  return result;
}
