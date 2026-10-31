import {
  CIRCLE_OS_LEGACY_STORAGE_KEY,
  CIRCLE_OS_STORAGE_KEY,
  createEmptyState,
  normalizeState,
} from "./circle-os-model.js";
import { accountStorageKey, assertAccountScope, scopedTransaction, type AccountScope } from "./account-scope";

const DATABASE_NAME = "circle-os";
const STORE_NAME = "state";
let saveQueue = Promise.resolve();

type StoredCircleState = {
  savedAt: string;
  state: unknown;
};

function storedRecord(value: unknown): StoredCircleState {
  if (
    value &&
    typeof value === "object" &&
    "savedAt" in value &&
    "state" in value &&
    typeof value.savedAt === "string"
  ) {
    return value as StoredCircleState;
  }
  return { savedAt: "", state: value };
}

function indexedState<T>(scope: AccountScope, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  return scopedTransaction<T>(scope, DATABASE_NAME, STORE_NAME, mode,
    (database) => { database.createObjectStore(STORE_NAME); },
    (store, result) => {
      const request = work(store);
      request.onsuccess = () => result(request.result);
    });
}

export async function loadCircleState(scope: AccountScope) {
  const storageKey = accountStorageKey(scope, CIRCLE_OS_STORAGE_KEY);
  let indexed: StoredCircleState | null = null;
  try {
    const stored = await indexedState(scope, "readonly", (store) => store.get(CIRCLE_OS_STORAGE_KEY));
    if (stored) indexed = storedRecord(stored);
  } catch {
    // Older browsers can still migrate from the original local copy.
  }
  assertAccountScope(scope);

  let local: StoredCircleState | null = null;
  try {
    const legacy =
      window.localStorage.getItem(storageKey) ||
      (scope.kind === "legacy" ? window.localStorage.getItem(CIRCLE_OS_LEGACY_STORAGE_KEY) : null);
    if (legacy) local = storedRecord(JSON.parse(legacy));
  } catch {
    // IndexedDB may still have a readable copy.
  }
  assertAccountScope(scope);

  const newest =
    local &&
    (!indexed ||
      String(local.savedAt).localeCompare(String(indexed.savedAt)) > 0)
      ? local
      : indexed;
  return normalizeState(newest?.state ?? createEmptyState());
}

export function saveCircleState(scope: AccountScope, state: unknown) {
  const storageKey = accountStorageKey(scope, CIRCLE_OS_STORAGE_KEY);
  const record: StoredCircleState = {
    savedAt: new Date().toISOString(),
    state: structuredClone(state),
  };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // IndexedDB remains the main phone copy when localStorage is unavailable.
  }

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      assertAccountScope(scope);
      await indexedState(scope, "readwrite", (store) => store.put(record, CIRCLE_OS_STORAGE_KEY));
    });
  return saveQueue;
}
