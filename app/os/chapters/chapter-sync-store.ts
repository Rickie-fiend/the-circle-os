import { assertAccountScope, scopedTransaction, type AccountScope } from "../account-scope";
import type { ChapterRun } from "./chapter-types";

type Head = { revision: number; run: ChapterRun };
type Operation = { id: string; baseRevision: number; run: ChapterRun };
export type ChapterCopies = { synced: ChapterRun; device: ChapterRun };
type Choice = { id: string; revision: number; operation?: Operation };
export type ChapterSyncEntry = Head & {
  pending?: Operation;
  latestId?: string;
  competing?: ChapterRun;
  choice?: Choice;
  reviewed?: ChapterCopies[];
  reviewAgain?: boolean;
};
type Entry = ChapterSyncEntry;
type Ledger = Record<string, Entry>;
type Reply = { status: "accepted"; revision: number } | { status: "conflict"; head: Head | null };
type RequestChapterSync = (input: string, init: RequestInit) => Promise<Response>;

export const chapterSyncSaved = "circle-chapter-sync-saved";

function transaction(scope: AccountScope, update?: (ledger: Ledger) => boolean) {
  if (scope.kind !== "account") throw new Error("Sign in to sync Chapters.");
  return scopedTransaction<Ledger>(scope, "circle-chapter-sync", "runs", update ? "readwrite" : "readonly",
    database => { database.createObjectStore("runs"); },
    (store, result, fail) => {
      const request = store.get("ledger");
      request.onsuccess = () => {
        try {
          const ledger: Ledger = Object.assign(Object.create(null), request.result);
          if (update?.(ledger)) store.put(ledger, "ledger");
          result(ledger);
        } catch (error) {
          fail(error instanceof Error ? error : new Error("Chapter progress could not be saved."));
        }
      };
    });
}

function announce(scope: AccountScope, localFinish?: ChapterRun) {
  assertAccountScope(scope);
  window.dispatchEvent(new CustomEvent(chapterSyncSaved, { detail: { accountId: scope.accountId, localFinish } }));
}

export const readChapterSync = (scope: AccountScope) => transaction(scope);

export async function chooseChapterCopy(scope: AccountScope, reviewed: ChapterSyncEntry, useDevice: boolean) {
  await transaction(scope, ledger => {
    const entry = ledger[reviewed.run.runId];
    if (!entry?.competing || entry.choice || entry.run.status !== "in-progress" ||
      entry.revision !== reviewed.revision || JSON.stringify(entry.competing) !== JSON.stringify(reviewed.competing)) {
      throw new Error("These answers changed. Review both copies again.");
    }
    if (useDevice && entry.competing.status !== "in-progress") throw new Error("You can read the finished device copy.");
    const choice: Choice = { id: crypto.randomUUID(), revision: entry.revision };
    if (useDevice) {
      choice.operation = {
        id: choice.id,
        baseRevision: entry.revision,
        run: { ...entry.competing, startedAt: entry.run.startedAt, updatedAt: new Date().toISOString() },
      };
    }
    ledger[entry.run.runId] = { ...entry, choice, reviewAgain: false };
    return true;
  });
  announce(scope);
}

function acceptChoice(entry: Entry, head: Head): Entry {
  return {
    ...head,
    reviewed: [...(entry.reviewed ?? []), { synced: entry.run, device: entry.competing! }],
  };
}

export function watchChapterSync(scope: AccountScope, refresh: (localFinish?: ChapterRun) => void) {
  const saved = (event: Event) => {
    const detail = (event as CustomEvent<{ accountId: string; localFinish?: ChapterRun }>).detail;
    if (detail?.accountId === scope.accountId) refresh(detail.localFinish);
  };
  window.addEventListener(chapterSyncSaved, saved);
  return () => window.removeEventListener(chapterSyncSaved, saved);
}

export async function savePublishedChapterProgress(scope: AccountScope, previous: ChapterRun | undefined, run: ChapterRun) {
  const id = crypto.randomUUID();
  await transaction(scope, ledger => {
    const entry = ledger[run.runId];
    if (entry?.competing) throw new Error("This Chapter changed on another device. Both copies are saved.");
    if (entry?.run.status === "completed" || JSON.stringify(entry?.run) !== JSON.stringify(previous)) {
      throw new Error("This Chapter changed. Open it again to continue.");
    }
    const revision = entry?.revision ?? 0;
    ledger[run.runId] = { ...entry, run, revision, latestId: id, pending: entry?.pending ?? { id, baseRevision: revision, run } };
    return true;
  });
  announce(scope, run.status === "completed" ? run : undefined);
}

const inFlight = new WeakMap<AccountScope, Promise<void>>();

export function syncPublishedChapters(scope: AccountScope, request: RequestChapterSync, existing: Record<string, ChapterRun>) {
  const active = inFlight.get(scope);
  if (active) return active;
  const sync = exchange().finally(() => inFlight.delete(scope));
  inFlight.set(scope, sync);
  return sync;

  async function rpc<T>(operation?: Operation): Promise<T> {
    const response = await request("/os/catalog/chapter-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: scope.accountId, operation: operation ?? null }),
    });
    if (!response.ok) throw new Error("Chapter sync could not finish.");
    const value = await response.json();
    assertAccountScope(scope);
    return value;
  }

  async function exchange() {
    const local = await transaction(scope);
    for (const [id, stored] of Object.entries(local)) {
      const operation = stored.choice?.operation ?? stored.pending;
      if (!operation) continue;
      const reply = await rpc<Reply>(operation);
      await transaction(scope, ledger => {
        const entry = ledger[id];
        if (stored.choice) {
          if (entry?.choice?.operation?.id !== operation.id || !entry.competing) return false;
          if (reply.status === "accepted") ledger[id] = acceptChoice(entry, { revision: reply.revision, run: operation.run });
          else if (reply.head) ledger[id] = { ...entry, ...reply.head, choice: undefined, reviewAgain: true };
          else throw new Error("Could not recover the other Chapter copy.");
          return true;
        }
        if (entry?.pending?.id !== operation.id) return false;
        if (reply.status === "conflict") {
          if (!reply.head) throw new Error("Could not recover the other Chapter copy.");
          ledger[id] = { ...reply.head, competing: entry.run, reviewed: entry.reviewed };
        } else {
          const revision = reply.revision;
          ledger[id] = entry.latestId === operation.id ? { revision, run: entry.run, reviewed: entry.reviewed } : {
            ...entry, revision,
            pending: { id: entry.latestId!, baseRevision: revision, run: entry.run },
          };
        }
        return true;
      });
      announce(scope);
    }
    const heads = await rpc<Head[]>();
    let changed = false;
    await transaction(scope, ledger => {
      for (const head of heads) {
        const id = head.run.runId;
        const entry = ledger[id];
        if (entry?.pending || entry?.choice?.operation) continue;
        if (entry?.choice && entry.competing) {
          if (local[id]?.choice?.id !== entry.choice.id) continue;
          if (head.revision < entry.choice.revision) continue;
          ledger[id] = head.revision === entry.choice.revision
            ? acceptChoice(entry, head)
            : { ...entry, ...head, choice: undefined, reviewAgain: true };
          changed = true;
          continue;
        }
        if (entry && entry.revision >= head.revision) continue;
        const competing = entry?.competing ?? (!entry ? existing[id] : undefined);
        ledger[id] = { ...head, competing, reviewed: entry?.reviewed, reviewAgain: Boolean(competing && entry) };
        changed = true;
      }
      return changed;
    });
    if (changed) announce(scope);
  }
}
