import { chapterRunId } from "./chapter-model.js";
import { assertAccountScope, scopedTransaction, type AccountScope } from "../account-scope";
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

async function run<T>(
  scope: AccountScope,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return scopedTransaction<T>(scope, DATABASE, STORE, mode,
    (database) => { database.createObjectStore(STORE, { keyPath: "key" }); },
    (store, result) => {
      const request = work(store);
      request.onsuccess = () => result(request.result);
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

export async function readChapterPublications(scope: AccountScope) {
  return run<StoredChapterPublication[]>(scope, "readonly", (store) => store.getAll());
}

export function writeChapterPublication(
  scope: AccountScope,
  publication: Omit<StoredChapterPublication, "key">,
) {
  const visibility = publication.visibility || publication.scope || "private";
  const targetApp = publication.targetApp || "note";
  const audienceProfileId = publication.audienceProfileId || "local";
  return run<IDBValidKey>(scope, "readwrite", (store) =>
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
  scope: AccountScope,
  publication: Omit<StoredChapterPublication, "key">,
) {
  const visibility = publication.visibility || publication.scope || "private";
  const targetApp = publication.targetApp || "note";
  const audienceProfileId = publication.audienceProfileId || "local";
  const key = chapterPublicationKey(publication.chapter, visibility, targetApp, audienceProfileId);
  return scopedTransaction<IDBValidKey>(scope, DATABASE, STORE, "readwrite",
    (database) => { database.createObjectStore(STORE, { keyPath: "key" }); },
    (store, result, fail) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const existing = request.result as StoredChapterPublication | undefined;
      if (
        existing &&
        JSON.stringify(existing.chapter) !== JSON.stringify(publication.chapter)
      ) {
        fail(new Error("That chapter version already exists. Create a new version."));
        return;
      }
      const put = store.put({
        ...publication,
        visibility,
        targetApp,
        audienceProfileId,
        key,
      });
      put.onsuccess = () => result(put.result);
    };
  });
}

export async function writeSyncedChapterPublications(
  scope: AccountScope,
  publications: ChapterPublication[],
) {
  await Promise.all(
    publications.map((publication) =>
      writeImmutableChapterPublication(scope, publication),
    ),
  );
  assertAccountScope(scope);
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
  // Set up once, whatever else has been published since.
  //
  // Every unanswered first-use chapter for an App used to queue up behind the
  // last one, so publishing three versions of the Log's setup asked the same
  // two questions three times over. Sai: "The setup is showing 3 times for log
  // app." Finishing any one of them is being set up; a newer version is for
  // whoever has not been through it yet.
  if (firstUsePublicationDone(publications, targetApp, runs)) return null;
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
  const latestByChapter = new Map<string, ChapterPublication>();
  for (const publication of publications
    .map(normalizeChapterPublication)
    .filter(
      (candidate) =>
        !candidate.firstUse &&
        candidate.targetApp === targetApp &&
        (candidate.visibility === "public" ||
          candidate.audienceProfileId === audienceProfileId ||
          candidate.audienceProfileId === "local"),
    )) {
    const latest = latestByChapter.get(publication.chapter.id);
    if (
      !latest ||
      publication.chapter.version > latest.chapter.version ||
      (publication.chapter.version === latest.chapter.version &&
        publication.publishedAt.localeCompare(latest.publishedAt) > 0)
    ) {
      latestByChapter.set(publication.chapter.id, publication);
    }
  }

  return (
    [...latestByChapter.values()]
      .sort(
        (a, b) =>
          b.publishedAt.localeCompare(a.publishedAt) ||
          b.chapter.version - a.chapter.version,
      )
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
