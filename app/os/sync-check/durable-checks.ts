/** Development-only synthetic recovery checks. Never opens the product writing DB. */
import { assertAccountScope, isAccountScopeCurrent, scopedTransaction, type AccountScope } from "../account-scope.js";
import * as writing from "../writing-model.js";
import * as queue from "../writing-sync-model.js";
import * as cloud from "../writing-cloud-model.js";
import { assertWritingChoice, prepareWritingChoice, queueWritingChoice, type WritingChoice } from "../writing-conflict-model.js";
import { syncAccountWriting, type WritingRemote } from "../writing-cloud-sync.js";

export const RECOVERY_DATABASE = "circle-os-writing-hosted-recovery-v1";
type Phase = "offline-saved" | "upload-reply-lost" | "choice-queued" | "choice-reply-lost" | "delete-queued" | "complete";
type Slot = "one" | "two" | "fresh";
type WithoutHeader<T> = T extends unknown ? Omit<T, "owner" | "operationId" | "at"> : never;
type LocalCommand = WithoutHeader<writing.WritingCommand>;
export type RecoveryRun = {
  schema: 1; owner: string; entryId: string; phase: Phase; documentTime: number;
  devices: Record<Slot, cloud.WritingCloudBundle>;
  upload: cloud.WritingUpload | null; choice: WritingChoice | null;
  checks: string[]; steps: string[];
};
const phases: Phase[] = ["offline-saved", "upload-reply-lost", "choice-queued", "choice-reply-lost", "delete-queued", "complete"];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function owner(scope: AccountScope) {
  assertAccountScope(scope);
  check(process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(location.hostname)
    && process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC !== "enabled" && scope.kind === "account", "Use local development, a confirmed test account and disabled sync.");
  return `account:${scope.accountId}`;
}
function empty(who: string): cloud.WritingCloudBundle {
  return { state: writing.createWritingState(who), queue: queue.createWritingSyncState(who), cloud: cloud.createWritingCloudState(who) };
}
function valid(value: RecoveryRun, who: string) {
  check(value?.schema === 1 && value.owner === who && /^recovery_[a-f0-9]{24}$/.test(value.entryId)
    && phases.includes(value.phase) && Number.isFinite(value.documentTime) && Array.isArray(value.checks)
    && Array.isArray(value.steps), "Invalid synthetic recovery checkpoint.");
  check(value.upload === null || value.upload.entryId === value.entryId, "Unexpected synthetic upload target.");
  if (value.choice) { assertWritingChoice(value.choice, who); check(value.choice.entryId === value.entryId, "Unexpected synthetic choice target."); }
  for (const slot of ["one", "two", "fresh"] as const) {
    const bundle = value.devices[slot];
    writing.assertWritingState(bundle.state, who); queue.assertWritingSyncState(bundle.queue, who); cloud.assertWritingCloudState(bundle.cloud, who);
    check(Object.keys(bundle.state.entries).every(id => id === value.entryId)
      && Object.keys(bundle.state.tombstones).every(id => id === value.entryId)
      && Object.values(bundle.state.drafts).every(draft => draft.entryId === value.entryId)
      && Object.values(bundle.queue.pending).every(change => change.entryId === value.entryId)
      && Object.values(bundle.cloud.choices || {}).every(choice => choice.entryId === value.entryId)
      && Object.values(bundle.cloud.resolved || {}).every(archive => archive.request.entryId === value.entryId), "Unexpected entry in synthetic recovery store.");
  }
  return value;
}
async function transaction(scope: AccountScope, update?: (run: RecoveryRun | null) => RecoveryRun): Promise<RecoveryRun | null> {
  const who = owner(scope);
  return scopedTransaction(scope, RECOVERY_DATABASE, "checkpoints", update ? "readwrite" : "readonly",
    db => { db.createObjectStore("checkpoints"); }, (store, done, fail) => {
      const request = store.get("run");
      request.onsuccess = () => {
        try {
          assertAccountScope(scope);
          let run = request.result === undefined ? null : valid(request.result, who);
          if (update) { run = valid(update(run), who); store.put(run, "run"); }
          done(run);
        } catch (cause) { fail(cause instanceof Error ? cause : new Error("Synthetic checkpoint failed.")); }
      };
    });
}
export const readRecoveryRun = (scope: AccountScope) => transaction(scope);
async function change(scope: AccountScope, entryId: string, update: (run: RecoveryRun) => RecoveryRun) {
  const run = await transaction(scope, current => {
    check(current?.entryId === entryId, "Synthetic recovery run changed. Reload before continuing.");
    return update(current);
  });
  return run!;
}
function device(scope: AccountScope, entryId: string, slot: Slot) {
  const read = async () => {
    const run = await readRecoveryRun(scope);
    check(run?.entryId === entryId, "Synthetic recovery run changed.");
    return run.devices[slot];
  };
  const update = async (transform: (bundle: cloud.WritingCloudBundle) => cloud.WritingCloudBundle) =>
    (await change(scope, entryId, run => ({ ...run, devices: { ...run.devices, [slot]: transform(run.devices[slot]) } }))).devices[slot];
  return { read, update, inventory: async () => {
    const before = await read(), pending = await cloud.inventoryWritingChanges(before.state, before.queue, before.cloud);
    return update(latest => {
      check(cloud.canonicalWriting(latest) === cloud.canonicalWriting(before), "Synthetic device changed during inventory.");
      return { ...latest, queue: pending };
    });
  } };
}
async function operation(bundle: cloud.WritingCloudBundle, command: LocalCommand) {
  const prepared = await writing.prepareWritingOperation({ owner: bundle.state.owner, operationId: crypto.randomUUID(), at: new Date().toISOString(), ...command });
  const result = writing.applyWritingOperation(bundle.state, prepared);
  const next = { state: result.state, queue: queue.enqueueWritingChange(bundle.queue, bundle.state, result), cloud: structuredClone(bundle.cloud) };
  if (result.receipt.outcome === "deleted") {
    const id = result.receipt.entryId;
    delete next.cloud.conflicts[id]; if (next.cloud.choices) delete next.cloud.choices[id];
    for (const [key, archive] of Object.entries(next.cloud.resolved || {})) if (archive.request.entryId === id) delete next.cloud.resolved![key];
  }
  return next;
}
async function saved(bundle: cloud.WritingCloudBundle, entryId: string, body: string) {
  const at = new Date().toISOString(), entry = bundle.state.entries[entryId];
  if (entry?.versions.at(-1)?.content.body === body) return bundle;
  const draft: writing.WritingDraftInput = { id: crypto.randomUUID(), entryId, kind: "note", source: null,
    startedAt: entry?.startedAt || at, baseGeneration: entry?.generation || 0, baseVersionId: entry?.currentVersionId || null,
    attribution: writing.writingAttribution(at, "Asia/Bangkok"), content: { title: "Synthetic reload check", body, tags: [] } };
  bundle = await operation(bundle, { type: "write-draft", draft, expectedDraftVersion: 0 });
  return operation(bundle, { type: "save", draft: { ...draft, version: 1 } });
}
async function save(scope: AccountScope, entryId: string, slot: Slot, body: string) {
  const target = device(scope, entryId, slot), before = await target.read(), next = await saved(before, entryId, body);
  await target.update(latest => {
    check(cloud.canonicalWriting(latest) === cloud.canonicalWriting(before), "Synthetic device changed during save.");
    return next;
  });
}
async function remoteFor(remote: WritingRemote, entryId: string): Promise<WritingRemote> {
  check(remote.resolve && remote.resolutions, "Resolution RPCs are required for recovery checks.");
  return { ...remote,
    inventory: async cursor => cursor ? [] : (await remote.inventory(entryId.slice(0, -1))).filter(h => h.entryId === entryId),
    resolutions: async cursor => {
      if (cursor) return [];
      const result = []; let after = "";
      for (;;) {
        const page = await remote.resolutions!(after);
        check(Array.isArray(page) && page.length <= 50, "Invalid resolution history page.");
        result.push(...page.filter(r => r.request.entryId === entryId));
        if (page.length < 50) return result;
        const next = page.at(-1)!.request.requestId;
        check(next > after, "Resolution history did not advance."); after = next;
      }
    },
  };
}
async function choose(scope: AccountScope, entryId: string, direction: "local" | "cloud") {
  const target = device(scope, entryId, "two"), bundle = await target.read();
  const existing = bundle.cloud.choices?.[entryId];
  if (existing) return existing;
  const request = await prepareWritingChoice(bundle, entryId, direction, new Date().toISOString(), `v_${crypto.randomUUID()}`);
  await target.update(latest => queueWritingChoice(latest, request)); return request;
}
async function checkpoint(scope: AccountScope, entryId: string, phase: Phase, documentTime: number, line: string) {
  return change(scope, entryId, run => ({ ...run, phase, documentTime, checks: [...run.checks, line] }));
}
export async function startRecoveryRun(scope: AccountScope, documentTime: number) {
  const who = owner(scope), entryId = `recovery_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const bundle = await saved(empty(who), entryId, "Synthetic reload initial writing");
  const upload = (await cloud.writingUploadRequests(bundle))[0];
  check(upload, "Synthetic save was not queued.");
  const run: RecoveryRun = { schema: 1, owner: who, entryId, phase: "offline-saved", documentTime,
    devices: { one: bundle, two: empty(who), fresh: empty(who) }, upload, choice: null, steps: [],
    checks: ["PASS: synthetic writing and its pending upload committed to separate account-scoped IndexedDB without a network request"] };
  await transaction(scope, previous => {
    check(!previous || previous.phase === "complete", "Finish the existing recovery run before starting another."); return run;
  });
  return run;
}
export async function continueRecoveryRun(scope: AccountScope, remote: WritingRemote, documentTime: number) {
  const who = owner(scope), run = await readRecoveryRun(scope);
  check(run?.owner === who, "Start the synthetic recovery checks first.");
  if (run.phase === "complete") {
    check(!JSON.stringify(run).includes("Synthetic reload"), "Deleted synthetic writing remains locally."); return run;
  }
  check(run.documentTime !== documentTime, "Reload this page before continuing the recovery checks.");
  const entryId = run.entryId, api = await remoteFor(remote, entryId);
  const sync = (slot: Slot) => syncAccountWriting({ store: device(scope, entryId, slot), remote: api, current: () => isAccountScopeCurrent(scope) });
  const step = async (key: string, work: () => Promise<unknown>) => {
    if ((await readRecoveryRun(scope))!.steps.includes(key)) return;
    await work();
    await change(scope, entryId, current => ({ ...current, steps: [...current.steps, key] }));
  };
  if (run.phase === "offline-saved") {
    check(run.upload && Object.keys(run.devices.one.queue.pending).length === 1, "Pending upload did not survive reload.");
    const result = await api.apply(run.upload);
    check(result.status === "accepted", "Hosted synthetic upload was not accepted.");
    // Deliberately drop the reply: no local acknowledgement is applied.
    return checkpoint(scope, entryId, "upload-reply-lost", documentTime, "PASS: pending save survived full reload; hosted upload accepted, reply deliberately dropped, original request remains durable");
  }
  if (run.phase === "upload-reply-lost") {
    check(run.upload && (await api.receipts(run.upload.changes.map(c => c.operationId))).length === run.upload.changes.length, "Accepted upload receipts were not recoverable.");
    await step("newer-upload-edit", () => save(scope, entryId, "one", "Synthetic reload newer writing after upload"));
    await step("upload-recovered", async () => {
      await sync("one"); const one = await device(scope, entryId, "one").read();
      check(!Object.keys(one.queue.pending).length && one.state.entries[entryId].versions.length === 2, "Upload recovery duplicated or lost newer writing.");
    });
    await step("second-seeded", () => sync("two"));
    await step("cloud-edit", () => save(scope, entryId, "one", "Synthetic reload cloud branch"));
    await step("device-edit", () => save(scope, entryId, "two", "Synthetic reload device branch"));
    await step("cloud-uploaded", () => sync("one")); await step("conflict-received", () => sync("two"));
    await step("local-choice", async () => {
      const request = await choose(scope, entryId, "local");
      await change(scope, entryId, current => ({ ...current, choice: request }));
    });
    return checkpoint(scope, entryId, "choice-queued", documentTime, "PASS: exact upload recovered after full reload without a duplicate; newer edit kept; both conflict histories and a queued choice committed to IndexedDB");
  }
  if (run.phase === "choice-queued") {
    check(run.choice && cloud.canonicalWriting(run.choice) === cloud.canonicalWriting(run.devices.two.cloud.choices?.[entryId]), "Queued choice changed during reload.");
    const result = await api.resolve!(run.choice);
    check(result.status === "resolved", "Hosted synthetic choice was not accepted.");
    return checkpoint(scope, entryId, "choice-reply-lost", documentTime, "PASS: queued choice survived full reload with identical request; hosted resolution accepted, reply deliberately dropped");
  }
  if (run.phase === "choice-reply-lost") {
    check(run.choice, "Resolution retry is missing.");
    await step("newer-choice-edit", () => save(scope, entryId, "two", "Synthetic reload newer writing after choice"));
    await step("choice-recovered", async () => {
      await sync("two"); const two = await device(scope, entryId, "two").read();
      check(two.state.entries[entryId].versions.at(-1)?.content.body === "Synthetic reload newer writing after choice"
        && Object.keys(two.queue.pending).length === 1 && two.cloud.conflicts[entryId]
        && cloud.canonicalWriting(two.cloud.resolved?.[run.choice!.requestId]?.request) === cloud.canonicalWriting(run.choice), "Resolution recovery lost newer writing or retained histories.");
    });
    await step("cloud-choice", () => choose(scope, entryId, "cloud")); await step("cloud-choice-synced", () => sync("two"));
    await step("fresh-history", async () => {
      await sync("fresh"); const fresh = await device(scope, entryId, "fresh").read();
      check(cloud.canonicalWriting(fresh.cloud.resolved?.[run.choice!.requestId]?.request) === cloud.canonicalWriting(run.choice), "Fresh device did not recover original histories.");
    });
    const target = device(scope, entryId, "two");
    for (const type of ["trash", "delete"] as const) {
      await step(`lifecycle-${type}`, async () => {
        const before = await target.read(), entry = before.state.entries[entryId];
        if (before.state.tombstones[entryId] || (type === "trash" && entry?.status === "trashed")) return;
        check(entry, "Synthetic lifecycle entry is missing.");
        const command: LocalCommand = type === "delete" ? { type, entryId, expectedGeneration: entry.generation, confirmed: true }
          : { type, entryId, expectedGeneration: entry.generation };
        const next = await operation(before, command); await target.update(() => next);
      });
    }
    return checkpoint(scope, entryId, "delete-queued", documentTime, "PASS: resolution retry survived full reload, newer writing stayed pending, fresh device recovered histories; permanent deletion queued durably");
  }
  check(run.phase === "delete-queued" && run.upload && run.choice && !run.devices.two.state.entries[entryId], "Deletion checkpoint did not survive reload.");
  await sync("two");
  const terminal = (await api.inventory(""))[0];
  check(terminal?.snapshot.tombstone && terminal.snapshot.entry === null, "Hosted deletion is missing.");
  const receipts = await api.receipts(run.upload.changes.map(c => c.operationId));
  const replay = await api.apply(run.upload);
  // An already accepted upload returns its immutable, body-free receipt even
  // after deletion. The invariant is an unchanged terminal head, not a new denial.
  check((replay.status === "deleted" || (replay.status === "accepted"
    && cloud.canonicalWriting(replay.receipts) === cloud.canonicalWriting(receipts)))
    && (await api.resolve!(run.choice)).status === "deleted"
    && cloud.canonicalWriting((await api.inventory(""))[0]) === cloud.canonicalWriting(terminal), "Stale upload or choice changed the terminal head.");
  await sync("one"); await sync("fresh");
  check((await api.resolutions!("")).length === 0, "Deleted histories remain readable.");
  return change(scope, entryId, current => {
    const final = { ...current, upload: null, choice: null, phase: "complete" as const, documentTime,
      checks: [...current.checks, "PASS: queued deletion survived full reload; cloud deletion confirmed; stale upload/choice could not restore writing; all three durable test devices and archived bodies scrubbed"] };
    check(Object.values(final.devices).every(d => !d.state.entries[entryId] && d.state.tombstones[entryId]
      && !Object.keys(d.queue.pending).length) && !JSON.stringify(final).includes("Synthetic reload"), "Deleted synthetic bodies remain in durable fixtures.");
    return final;
  });
}
