import { assertAccountScope, scopedTransaction, type AccountScope } from "./account-scope";
import { ensureDay, upsertTimeBlock } from "./circle-os-model.js";
import { logBlockSignature, logEntryWords, type LogCorrection } from "./log-history.js";
import type { CircleState, TimeBlock } from "./circle-os-shell";

type Day = CircleState["days"][string];
type Snapshot = { dateKey: string; block: TimeBlock; cleared: boolean };
type Head = Snapshot & { revision: number; corrections: LogCorrection[] };
type Operation = Snapshot & { id: string; baseRevision: number; correctionId?: string };
type Pending = { operation: Operation; correction?: LogCorrection };
export type LogCopyPair = { id: string; saved: Head; device: Snapshot };
type Choice = { id: string; revision: number; write?: Pending };
type Entry = { head?: Head; pending?: Pending[]; competing?: Snapshot; choice?: Choice; reviewAgain?: boolean; archived?: LogCopyPair[] };
type Ledger = Record<string, Entry>;
export type LogConflict = LogCopyPair & { waiting: boolean; reviewAgain: boolean };
type Reply = { status: "accepted"; revision: number } | { status: "conflict"; head: Head | null };
type LogRequest = (input: string, init: RequestInit) => Promise<Response>;

const key = ({ dateKey, block }: Snapshot) => dateKey + ":" + block.id;
const changed = "circle-log-sync-changed";
const snapshot = (entry: Entry) => entry.pending?.at(-1)?.operation ?? entry.head;

function transaction(scope: AccountScope, change?: (ledger: Ledger) => boolean) {
  if (scope.kind !== "account") throw new Error("Sign in to sync Log.");
  return scopedTransaction<Ledger>(scope, "circle-log-sync", "records", change ? "readwrite" : "readonly",
    db => { db.createObjectStore("records"); },
    (store, result, fail) => {
      const request = store.get("ledger");
      request.onsuccess = () => {
        try {
          const ledger: Ledger = Object.assign(Object.create(null), request.result);
          if (change?.(ledger)) store.put(ledger, "ledger");
          result(ledger);
        } catch (error) { fail(error instanceof Error ? error : Error("Could not save Log.")); }
      };
    });
}

export const readLogSync = (scope: AccountScope) => transaction(scope);

function announce(scope: AccountScope) {
  assertAccountScope(scope);
  window.dispatchEvent(new CustomEvent(changed, { detail: scope.accountId }));
}

export function watchLogSync(scope: AccountScope, refresh: () => void) {
  const onChange = (event: Event) => { if ((event as CustomEvent).detail === scope.accountId) refresh(); };
  window.addEventListener(changed, onChange);
  return () => window.removeEventListener(changed, onChange);
}

export function logSyncConflicts(ledger: Ledger): LogConflict[] {
  return Object.entries(ledger).flatMap(([id, entry]) => entry.competing && entry.head
    ? [{ id, saved: entry.head, device: entry.competing, waiting: Boolean(entry.choice), reviewAgain: Boolean(entry.reviewAgain) }] : []);
}

export const logSavedCopies = (ledger: Ledger) => Object.values(ledger).flatMap(entry => entry.archived ?? []);

export function canUseLogDeviceWords({ saved, device }: LogCopyPair) {
  const { title, moments } = logEntryWords(device.block);
  return !saved.cleared && !device.cleared && Boolean(title || moments.length) &&
    saved.dateKey === device.dateKey && saved.block.start === device.block.start && saved.block.end === device.block.end;
}

export async function chooseLogCopy(scope: AccountScope, viewed: LogConflict, useDevice: boolean) {
  await transaction(scope, ledger => {
    const entry = ledger[viewed.id];
    const head = entry?.head;
    const device = entry?.competing;
    if (!head || !device || entry.choice || head.revision !== viewed.saved.revision ||
      key(head) !== key(viewed.saved) || JSON.stringify(viewed.device) !== JSON.stringify(device)) {
      throw new Error("These copies changed. Review them again.");
    }
    const canonical = ledger[key(head)];
    if (canonical?.pending?.length || canonical?.head?.revision !== head.revision ||
        Object.values(ledger).some(item => item.choice && item.head && key(item.head) === key(head))) {
      throw new Error("A change to this entry is still syncing. Try again shortly.");
    }
    const choice: Choice = { id: crypto.randomUUID(), revision: head.revision };
    if (useDevice) {
      if (!canUseLogDeviceWords({ id: viewed.id, saved: head, device })) throw new Error("These copies are available to read in History.");
      const { title, moments } = logEntryWords(device.block);
      const updatedAt = new Date().toISOString();
      const block = { ...head.block, activity: title, note: "", title, moments, updatedAt };
      choice.write = {
        operation: { id: choice.id, baseRevision: head.revision, dateKey: head.dateKey, cleared: false, block, correctionId: choice.id },
        correction: { id: choice.id, dateKey: head.dateKey, blockId: block.id, correctedAt: updatedAt, before: head.block, after: block },
      };
    }
    ledger[viewed.id] = { ...entry, choice, reviewAgain: false };
    return true;
  });
  announce(scope);
}

function settleLogChoice(ledger: Ledger, id: string, entry: Entry, head: Head) {
  const archived = [...(entry.archived ?? []), { id: entry.choice!.id, saved: entry.head!, device: entry.competing! }];
  const target = key(head);
  if (id === target) ledger[id] = { head, archived };
  else {
    ledger[id] = { archived };
    const canonical = ledger[target];
    ledger[target] = { ...canonical, head,
      reviewAgain: canonical?.reviewAgain || Boolean(canonical?.competing && canonical.head?.revision !== head.revision) };
  }
}

export function projectLogSync(state: CircleState, ledger: Ledger): CircleState {
  const byDay = new Map<string, { ids: Set<string>; blocks: TimeBlock[]; corrections: LogCorrection[] }>();
  for (const entry of Object.values(ledger)) {
    const shown = snapshot(entry);
    const sample = shown ?? entry.competing ?? entry.archived?.[0]?.device;
    if (!sample) continue;
    const day = byDay.get(sample.dateKey) ?? { ids: new Set<string>(), blocks: [], corrections: [] };
    byDay.set(sample.dateKey, day);
    if (entry.competing) day.ids.add(entry.competing.block.id);
    for (const review of entry.archived ?? []) day.ids.add(review.device.block.id);
    if (shown && (!entry.competing || shown.block.id === entry.competing.block.id)) {
      day.ids.add(shown.block.id);
      if (!shown.cleared) day.blocks.push(shown.block);
      day.corrections.push(...(entry.head?.corrections ?? []));
      for (const { correction } of entry.pending ?? []) if (correction) day.corrections.push(correction);
    }
  }
  for (const [dateKey, managed] of byDay) {
    const source = state.days[dateKey] ?? ensureDay(state, dateKey).days[dateKey];
    const blocks = source.timeBlocks.filter(block => !managed.ids.has(block.id));
    // Preserve a device's pre-pilot slot if the same hour arrives from sync.
    const occupied = new Set(blocks.map(block => block.start));
    let day = { ...source, timeBlocks: blocks, logCorrections: { ...source.logCorrections } };
    for (const block of managed.blocks) {
      if (occupied.has(block.start)) continue;
      day = upsertTimeBlock(day, block);
      occupied.add(block.start);
    }
    // Managed corrections are projections too. Rejected local corrections
    // remain in the competing copy and cannot suppress the accepted record.
    for (const [id, receipt] of Object.entries(day.logCorrections)) {
      if (managed.ids.has(receipt.blockId)) delete day.logCorrections[id];
    }
    for (const correction of managed.corrections) day.logCorrections[correction.id] = correction;
    state = { ...state, days: { ...state.days, [dateKey]: day } };
  }
  return state;
}

// Every Log editor changes one block. Existing device-only blocks stay on
// their current save path until a separately reviewed import.
export async function saveLogDay(scope: AccountScope, before: Day, after: Day) {
  const previous = new Map(before.timeBlocks.map(block => [block.id, block]));
  const next = new Map(after.timeBlocks.map(block => [block.id, block]));
  const ids = [...new Set([...previous.keys(), ...next.keys()])].filter(id => logBlockSignature(previous.get(id)) !== logBlockSignature(next.get(id)));
  if (!ids.length) return true;
  if (ids.length !== 1) throw new Error("Save one Log entry at a time.");
  const id = ids[0], original = previous.get(id), updated = next.get(id);
  const savedCorrection = Object.values(after.logCorrections ?? {}).find(receipt => receipt.blockId === id && !before.logCorrections?.[receipt.id]);
  const timestamp = savedCorrection?.correctedAt ?? updated?.updatedAt ?? new Date().toISOString();
  const block = updated ?? { ...original!, title: "", activity: "", note: "", moments: [], updatedAt: timestamp };
  let handled = false;
  await transaction(scope, ledger => {
    const recordKey = key({ dateKey: before.date, block, cleared: !updated });
    const entry = ledger[recordKey];
    if (original && !entry) return false;
    const visible = entry && snapshot(entry);
    if (entry?.competing) throw new Error("Review both copies in Log History.");
    if (Object.values(ledger).some(item => item.choice && item.head && key(item.head) === recordKey)) {
      throw new Error("Your Log choice is still syncing.");
    }
    if (entry && (visible?.cleared || logBlockSignature(visible?.block) !== logBlockSignature(original))) {
      throw new Error("This Log entry changed. Open it again to continue.");
    }
    if (!original && Object.values(ledger).some(item => {
      const current = snapshot(item);
      return current && !item.competing && !current.cleared && current.dateKey === before.date && current.block.start === block.start;
    })) throw new Error("This hour changed. Open it again to continue.");
    const pending = entry?.pending ?? [];
    const operation: Operation = {
      id: crypto.randomUUID(), baseRevision: (entry?.head?.revision ?? 0) + pending.length,
      dateKey: before.date, cleared: !updated, block: { ...block, updatedAt: timestamp, moments: block.moments ?? [] },
      ...(savedCorrection ? { correctionId: savedCorrection.id } : {}),
    };
    const correction = savedCorrection ?? (!updated && original ? {
      id: operation.id, dateKey: before.date, blockId: id, correctedAt: timestamp, before: original, after: operation.block,
    } : undefined);
    ledger[recordKey] = { ...entry, pending: [...pending, { operation, correction }] };
    handled = true;
    return true;
  });
  if (handled) announce(scope);
  return handled;
}

const inFlight = new WeakSet<AccountScope>();

export async function syncLog(scope: AccountScope, request: LogRequest) {
  if (inFlight.has(scope)) return;
  inFlight.add(scope);
  const rpc = async <T>(operation: Operation | null): Promise<T> => {
    const response = await request("/os/log-sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner: scope.accountId, operation }),
    });
    if (!response.ok) throw new Error("Could not sync Log.");
    const value = await response.json();
    assertAccountScope(scope);
    return value as T;
  };
  try {
    const local = await transaction(scope);
    for (const [id, stored] of Object.entries(local)) {
      const choice = stored.choice;
      const first = choice?.write ?? stored.pending?.[0];
      if (!first) continue;
      let reply: Reply;
      try { reply = await rpc<Reply>(first.operation); }
      catch { assertAccountScope(scope); continue; }
      await transaction(scope, ledger => {
        const entry = ledger[id];
        if (choice) {
          if (entry?.choice?.id !== choice.id || !entry.head || !entry.competing) return false;
          if (reply.status === "accepted") {
            const corrections = [...entry.head.corrections, ...(first.correction ? [first.correction] : [])];
            settleLogChoice(ledger, id, entry, { ...first.operation, corrections, revision: reply.revision });
          } else if (reply.head) {
            const target = key(reply.head);
            ledger[id] = { ...entry, head: reply.head, choice: undefined, reviewAgain: true };
            if (id !== target && !ledger[target]?.pending?.length && (ledger[target]?.head?.revision ?? 0) < reply.head.revision) {
              ledger[target] = { ...ledger[target], head: reply.head };
            }
          } else return false;
          return true;
        }
        if (entry?.pending?.[0]?.operation.id !== first.operation.id) return false;
        if (reply.status === "conflict") {
          if (!reply.head) return false;
          const headKey = key(reply.head);
          ledger[id] = { head: reply.head, competing: entry.pending.at(-1)!.operation, archived: entry.archived };
          if (headKey !== id && !ledger[headKey]?.pending && (ledger[headKey]?.head?.revision ?? 0) < reply.head.revision) {
            ledger[headKey] = { ...ledger[headKey], head: reply.head };
          }
        } else {
          const corrections = [...(entry.head?.corrections ?? []), ...(first.correction ? [first.correction] : [])];
          ledger[id] = { ...entry, head: { ...first.operation, corrections, revision: reply.revision }, pending: entry.pending.slice(1) };
        }
        return true;
      });
      announce(scope);
    }
    const heads = await rpc<Head[]>(null);
    let pulled = false;
    await transaction(scope, ledger => {
      const byKey = new Map(heads.map(head => [key(head), head]));
      for (const head of heads) {
        const id = key(head), entry = ledger[id];
        if (entry?.pending?.length || entry?.competing || (entry?.head?.revision ?? 0) >= head.revision) continue;
        ledger[id] = { ...entry, head };
        pulled = true;
      }
      for (const [id, entry] of Object.entries(ledger)) {
        if (!entry.competing || !entry.head || entry.choice?.write) continue;
        const head = byKey.get(key(entry.head));
        if (!head || head.revision < entry.head.revision) continue;
        if (head.revision > entry.head.revision) {
          ledger[id] = { ...entry, head, choice: undefined, reviewAgain: true };
          pulled = true;
        } else if (entry.choice && local[id]?.choice?.id === entry.choice.id) {
          settleLogChoice(ledger, id, entry, head);
          pulled = true;
        }
      }
      return pulled;
    });
    if (pulled) announce(scope);
  } finally { inFlight.delete(scope); }
}
