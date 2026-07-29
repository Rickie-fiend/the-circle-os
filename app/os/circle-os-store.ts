import {
  CIRCLE_OS_LEGACY_STORAGE_KEY,
  CIRCLE_OS_STORAGE_KEY,
  createEmptyState,
  normalizeState,
} from "./circle-os-model.js";

const DATABASE_NAME = "circle-os";
const STORE_NAME = "state";

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
  try {
    const stored = await readIndexedState();
    if (stored) return normalizeState(stored);
  } catch {
    // Older browsers can still migrate from the original local copy.
  }

  try {
    const legacy =
      window.localStorage.getItem(CIRCLE_OS_STORAGE_KEY) ||
      window.localStorage.getItem(CIRCLE_OS_LEGACY_STORAGE_KEY);
    return normalizeState(legacy ? JSON.parse(legacy) : createEmptyState());
  } catch {
    return createEmptyState();
  }
}

export async function saveCircleState(state: unknown) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(state, CIRCLE_OS_STORAGE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
