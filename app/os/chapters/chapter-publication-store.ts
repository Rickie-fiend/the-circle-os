import type { ChapterDefinition } from "./chapter-types";

export type StoredChapterPublication = {
  key: string;
  scope: "private" | "public";
  source: string;
  publishedAt: string;
  chapter: ChapterDefinition;
};

const DATABASE = "circle-os-chapter-publications";
const STORE = "chapters";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export function chapterPublicationKey(
  chapter: Pick<ChapterDefinition, "id" | "version">,
  scope: StoredChapterPublication["scope"] = "private",
) {
  return `${scope}:${chapter.id}:v${chapter.version}`;
}

export async function readChapterPublications() {
  return run<StoredChapterPublication[]>("readonly", (store) => store.getAll());
}

export function writeChapterPublication(
  publication: Omit<StoredChapterPublication, "key">,
) {
  return run<IDBValidKey>("readwrite", (store) =>
    store.put({
      ...publication,
      key: chapterPublicationKey(publication.chapter, publication.scope),
    }),
  );
}

export async function writeImmutableChapterPublication(
  publication: Omit<StoredChapterPublication, "key">,
) {
  const key = chapterPublicationKey(publication.chapter, publication.scope);
  const database = await openDatabase();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const existing = request.result as StoredChapterPublication | undefined;
      if (existing && existing.source && existing.source !== publication.source) {
        transaction.abort();
        reject(new Error("That chapter version already exists. Create a new version."));
        return;
      }
      const put = store.put({ ...publication, key });
      put.onsuccess = () => resolve(put.result);
      put.onerror = () => reject(put.error);
    };
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });
}
