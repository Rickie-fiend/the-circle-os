import { chapterRunId } from "./chapter-model.js";
import type {
  AppTarget,
  ChapterDefinition,
  ChapterPublication,
  ChapterRun,
} from "./chapter-types";

export const CHAPTER_PUBLICATION_EVENT = "circle-os:chapter-published";

export type StoredChapterPublication = {
  key: string;
  scope?: "private" | "public";
  source: string;
  publishedAt: string;
  chapter: ChapterDefinition;
  targetApp?: AppTarget;
  audienceProfileId?: string;
  visibility?: "private" | "public";
  delivery?: "manual" | "on-view";
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
  visibility: "private" | "public" = "private",
  targetApp: AppTarget = "note",
  audienceProfileId = "local",
) {
  return `${visibility}:${targetApp}:${audienceProfileId}:${chapter.id}:v${chapter.version}`;
}

export async function readChapterPublications() {
  return run<StoredChapterPublication[]>("readonly", (store) => store.getAll());
}

export function writeChapterPublication(
  publication: Omit<StoredChapterPublication, "key">,
) {
  const visibility = publication.visibility || publication.scope || "private";
  const targetApp = publication.targetApp || "note";
  const audienceProfileId = publication.audienceProfileId || "local";
  return run<IDBValidKey>("readwrite", (store) =>
    store.put({
      ...publication,
      visibility,
      targetApp,
      audienceProfileId,
      key: chapterPublicationKey(publication.chapter, visibility, targetApp, audienceProfileId),
    }),
  );
}

export async function writeImmutableChapterPublication(
  publication: Omit<StoredChapterPublication, "key">,
) {
  const visibility = publication.visibility || publication.scope || "private";
  const targetApp = publication.targetApp || "note";
  const audienceProfileId = publication.audienceProfileId || "local";
  const key = chapterPublicationKey(publication.chapter, visibility, targetApp, audienceProfileId);
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
      const put = store.put({
        ...publication,
        visibility,
        targetApp,
        audienceProfileId,
        key,
      });
      put.onsuccess = () => resolve(put.result);
      put.onerror = () => reject(put.error);
    };
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });
}

export function normalizeChapterPublication(
  publication: StoredChapterPublication,
): ChapterPublication {
  return {
    chapter: publication.chapter,
    targetApp: publication.targetApp || "note",
    audienceProfileId: publication.audienceProfileId || "local",
    visibility: publication.visibility || publication.scope || "private",
    delivery: publication.delivery || "manual",
    source: publication.source === "athena" ? "athena" : "admin",
    publishedAt: publication.publishedAt,
  };
}

export function publicationIsNewerThanRun(
  publication: Pick<ChapterPublication, "publishedAt">,
  run?: ChapterRun,
) {
  if (!run) return true;
  const latestRunMoment =
    run.completedAt || run.dismissedAt || run.startedAt || run.updatedAt || "";
  return publication.publishedAt.localeCompare(latestRunMoment) > 0;
}

export function selectPendingAppPublication(
  publications: StoredChapterPublication[],
  targetApp: AppTarget,
  audienceProfileId: string,
  runs: Record<string, ChapterRun>,
  options: { includeDeferred?: boolean } = {},
) {
  return (
    publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          publication.targetApp === targetApp &&
          (publication.visibility === "public" ||
            publication.audienceProfileId === audienceProfileId ||
            publication.audienceProfileId === "local"),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .find((publication) => {
        const run = runs[chapterRunId(publication.chapter)];
        if (publicationIsNewerThanRun(publication, run)) return true;
        return run?.status !== "completed" &&
          (options.includeDeferred || !run?.deferredAt);
      }) || null
  );
}

export function announceChapterPublication() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHAPTER_PUBLICATION_EVENT));
  }
}
