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
  firstUse?: boolean;
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
      if (
        existing &&
        JSON.stringify(existing.chapter) !== JSON.stringify(publication.chapter)
      ) {
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

export async function writeSyncedChapterPublications(
  publications: ChapterPublication[],
) {
  await Promise.all(
    publications.map((publication) =>
      writeImmutableChapterPublication(publication),
    ),
  );
  if (publications.length) announceChapterPublication();
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
    firstUse: Boolean(publication.firstUse),
    publishedAt: publication.publishedAt,
  };
}

/**
 * The setup chapter an App should open on, if one has been published and is not
 * finished yet.
 *
 * Separate from `selectPendingAppPublication` on purpose. An ordinary delivery
 * visits an App and retires; a setup publication *is* the App until it is done,
 * so it must not be filtered out by a deferral or overtaken by a newer everyday
 * chapter waiting in the same queue.
 */
export function selectFirstUsePublication(
  publications: StoredChapterPublication[],
  targetApp: AppTarget,
  audienceProfileId: string,
  runs: Record<string, ChapterRun>,
) {
  return (
    publications
      .map(normalizeChapterPublication)
      .filter(
        (publication) =>
          publication.firstUse &&
          publication.targetApp === targetApp &&
          (publication.visibility === "public" ||
            publication.audienceProfileId === audienceProfileId ||
            publication.audienceProfileId === "local"),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .find(
        (publication) =>
          runs[chapterRunId(publication.chapter)]?.status !== "completed",
      ) || null
  );
}

/**
 * Whether an App's first-use setup has been finished by a published chapter,
 * whichever version of it the person actually answered.
 */
export function firstUsePublicationDone(
  publications: StoredChapterPublication[],
  targetApp: AppTarget,
  runs: Record<string, ChapterRun>,
) {
  return publications
    .map(normalizeChapterPublication)
    .some(
      (publication) =>
        publication.firstUse &&
        publication.targetApp === targetApp &&
        runs[chapterRunId(publication.chapter)]?.status === "completed",
    );
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
          !publication.firstUse &&
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
