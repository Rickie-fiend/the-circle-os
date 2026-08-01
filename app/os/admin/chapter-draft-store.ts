import type { ChapterDraft } from "./chapter-authoring.js";

const DATABASE = "circle-os-authoring";
const STORE = "chapter-drafts";

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "draftId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDraftDatabase();
  return new Promise<T>((resolve, reject) => {
    const request = work(database.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).finally(() => database.close());
}

export async function readChapterDrafts() {
  const drafts = await transaction<ChapterDraft[]>("readonly", (store) => store.getAll());
  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function writeChapterDraft(draft: ChapterDraft) {
  return transaction<IDBValidKey>("readwrite", (store) => store.put(draft));
}

export function removeChapterDraft(draftId: string) {
  return transaction<undefined>("readwrite", (store) => store.delete(draftId));
}
