import {
  CIRCLE_OS_LEGACY_STORAGE_KEY,
  CIRCLE_OS_STORAGE_KEY,
  createEmptyState,
  normalizeState,
} from "./circle-os-model.js";

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

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedState() {
  const database = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CIRCLE_OS_STORAGE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function loadCircleState() {
  let indexed: StoredCircleState | null = null;
  try {
    const stored = await readIndexedState();
    if (stored) indexed = storedRecord(stored);
  } catch {
    // Older browsers can still migrate from the original local copy.
  }

  let local: StoredCircleState | null = null;
  try {
    const legacy =
      window.localStorage.getItem(CIRCLE_OS_STORAGE_KEY) ||
      window.localStorage.getItem(CIRCLE_OS_LEGACY_STORAGE_KEY);
    if (legacy) local = storedRecord(JSON.parse(legacy));
  } catch {
    // IndexedDB may still have a readable copy.
  }

  const newest =
    local &&
    (!indexed ||
      String(local.savedAt).localeCompare(String(indexed.savedAt)) > 0)
      ? local
      : indexed;
  return normalizeState(newest?.state ?? createEmptyState());
}

export function saveCircleState(state: unknown) {
  const record: StoredCircleState = {
    savedAt: new Date().toISOString(),
    state,
  };
  try {
    window.localStorage.setItem(CIRCLE_OS_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // IndexedDB remains the main phone copy when localStorage is unavailable.
  }

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction
          .objectStore(STORE_NAME)
          .put(record, CIRCLE_OS_STORAGE_KEY);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
    });
  return saveQueue;
}
