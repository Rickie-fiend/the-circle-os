// Storage ownership only. The future auth adapter must supply the verified
// account ID; this marker is never proof of identity or server authorization.
export const ACCOUNT_SCOPE_STORAGE_KEY = "circle-os-account-scope-v1";
export const DEVELOPMENT_TEST_SCOPE_STORAGE_KEY = "circle-os-development-test-scope-v1";

export class AccountScopeChangedError extends Error {
  constructor() {
    super("The active account changed. Please try again.");
    this.name = "AccountScopeChangedError";
  }
}

const legacy = { kind: "legacy", accountId: "", epoch: "legacy" };
const serverScope = Object.freeze({ ...legacy, signal: new AbortController().signal });
let controller = new AbortController();
let current = Object.freeze({ ...legacy, signal: controller.signal });
let listening = false;
let switchingFailed = false;
let developmentTest = false;
const listeners = new Set();
const scopeStorageKey = () => developmentTest ? DEVELOPMENT_TEST_SCOPE_STORAGE_KEY : ACCOUNT_SCOPE_STORAGE_KEY;

function marker() {
  if (switchingFailed) return { kind: "signed-out", accountId: "", epoch: "switch-failed" };
  try {
    const raw = window.localStorage.getItem(scopeStorageKey());
    if (raw === null) {
      if (developmentTest) return { kind: "signed-out", accountId: "", epoch: "empty-test" };
      // Removing a marker must not reopen the legacy profile in a running tab.
      if (current.kind === "legacy") return legacy;
      const closed = { kind: "signed-out", accountId: "", epoch: "missing" };
      window.localStorage.setItem(scopeStorageKey(), JSON.stringify(closed));
      return closed;
    }
    const value = JSON.parse(raw);
    if (
      value && typeof value.epoch === "string" && value.epoch &&
      (value.kind === "signed-out" ||
        (value.kind === "account" && typeof value.accountId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value.accountId)))
    ) {
      return { kind: value.kind, accountId: value.kind === "account" ? value.accountId : "", epoch: value.epoch };
    }
  } catch {
    // An unreadable identity marker cannot authorize a local-data read.
  }
  return { kind: "signed-out", accountId: "", epoch: "unreadable" };
}

function refresh(notify = false) {
  if (typeof window === "undefined") return serverScope;
  const next = marker();
  if (controller.signal.aborted || next.kind !== current.kind || next.accountId !== current.accountId || next.epoch !== current.epoch) {
    controller.abort();
    controller = new AbortController();
    current = Object.freeze({ ...next, signal: controller.signal });
  }
  if (notify) for (const listener of listeners) listener();
  return current;
}

function listen() {
  if (listening || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  listening = true;
  window.addEventListener("storage", (event) => {
    if (event.key === scopeStorageKey() || event.key === null) refresh(true);
  });
}

export function getAccountScope() {
  listen();
  return refresh();
}

export function getServerAccountScope() {
  return serverScope;
}

export function subscribeAccountScope(listener) {
  listen();
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Development tests have their own selection marker as well as their own
// account stores. Entering test mode never replaces a real/legacy selection.
export function enableDevelopmentTestScope() {
  if (process.env.NODE_ENV !== "development") throw new Error("Test sessions are only available in development.");
  if (!developmentTest) {
    developmentTest = true;
    switchingFailed = false;
    controller.abort();
    refresh(true);
  }
}

// Called by the auth adapter, not by product controls. Null closes all local
// evidence access. Switching never reads, claims, moves, or deletes old records.
export function activateAccountScope(accountId) {
  if (typeof window === "undefined") throw new Error("Account switching requires a browser.");
  if (accountId !== null && !/^[A-Za-z0-9_-]{1,128}$/.test(accountId)) throw new Error("Invalid account ID.");
  try {
    window.localStorage.setItem(scopeStorageKey(), JSON.stringify({
      kind: accountId === null ? "signed-out" : "account",
      accountId: accountId || "",
      epoch: crypto.randomUUID(),
    }));
    switchingFailed = false;
  } catch (error) {
    // A failed logout/switch must close the current tab even when a browser
    // refuses to persist the marker. A later successful activation can reopen it.
    switchingFailed = true;
    refresh(true);
    throw error;
  }
  return refresh(true);
}

export function isAccountScopeCurrent(scope) {
  return !scope.signal.aborted && getAccountScope() === scope && scope.kind !== "signed-out";
}

export function assertAccountScope(scope) {
  if (!isAccountScopeCurrent(scope)) throw new AccountScopeChangedError();
}

export function accountStorageKey(scope, legacyKey) {
  assertAccountScope(scope);
  return scope.kind === "legacy" ? legacyKey : `${legacyKey}:account:${scope.accountId}`;
}

// Resolve only after a transaction commits. Abort queued/in-flight work when
// its scope closes, and always bind the database name before the first await.
export async function scopedTransaction(scope, databaseName, storeName, mode, create, work) {
  const name = accountStorageKey(scope, databaseName);
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    const abort = () => reject(new AccountScopeChangedError());
    scope.signal.addEventListener("abort", abort, { once: true });
    request.onupgradeneeded = () => {
      if (scope.signal.aborted) request.transaction?.abort();
      else create(request.result);
    };
    request.onsuccess = () => {
      scope.signal.removeEventListener("abort", abort);
      if (scope.signal.aborted) { request.result.close(); reject(new AccountScopeChangedError()); }
      else resolve(request.result);
    };
    request.onerror = () => {
      scope.signal.removeEventListener("abort", abort);
      reject(request.error);
    };
  });
  try {
    assertAccountScope(scope);
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      let value;
      let failure = null;
      const abort = () => {
        try { transaction.abort(); } catch { /* It may already have committed. */ }
      };
      const cleanup = () => scope.signal.removeEventListener("abort", abort);
      scope.signal.addEventListener("abort", abort, { once: true });
      transaction.oncomplete = () => {
        cleanup();
        try { assertAccountScope(scope); resolve(value); } catch (error) { reject(error); }
      };
      transaction.onabort = () => {
        cleanup();
        reject(failure || (scope.signal.aborted ? new AccountScopeChangedError() : transaction.error || new Error("Local save failed.")));
      };
      transaction.onerror = () => { /* onabort handles transaction failure */ };
      try {
        work(transaction.objectStore(storeName), (result) => { value = result; }, (error) => { failure = error; transaction.abort(); });
      } catch (error) {
        failure = error instanceof Error ? error : new Error("Local storage failed.");
        transaction.abort();
      }
    });
  } finally {
    database.close();
  }
}
