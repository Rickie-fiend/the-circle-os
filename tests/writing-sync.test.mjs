import assert from "node:assert/strict";
import test from "node:test";
import * as writing from "../app/os/writing-model.js";
import * as sync from "../app/os/writing-sync-model.js";

const owner = "account:synthetic-sync";
const at = "2026-11-05T03:00:00.000Z";
function fixture() { return { state: writing.createWritingState(owner), queue: sync.createWritingSyncState(owner) }; }
async function commit(pair, command) {
  const prepared = await writing.prepareWritingOperation({ owner, at, operationId: crypto.randomUUID(), ...command });
  const result = writing.applyWritingOperation(pair.state, prepared);
  return { ...result, queue: sync.enqueueWritingChange(pair.queue, pair.state, result), command: prepared.command };
}
function draft(entry = null, body = "Synthetic saved words", kind = "note") {
  return { id: crypto.randomUUID(), entryId: entry?.id || crypto.randomUUID(), kind,
    startedAt: entry?.startedAt || at, attribution: writing.writingAttribution(at, "Asia/Bangkok"),
    baseVersionId: entry?.currentVersionId || null, baseGeneration: entry?.generation || 0,
    content: { title: "", body, tags: [] }, source: null };
}
async function save(pair = fixture(), input = draft()) {
  const written = await commit(pair, { type: "write-draft", draft: input, expectedDraftVersion: 0 });
  return commit(written, { type: "save", draft: { ...input, version: 1 } });
}
function ack(change, overrides = {}) {
  return { owner, operationId: change.operationId, entryId: change.entryId, fingerprint: change.fingerprint,
    generation: change.generation, receiptId: crypto.randomUUID(), serverVersion: change.sequence, ...overrides };
}
const pending = (pair) => sync.pendingWritingChanges(pair.queue);

test("only accepted saved changes queue; drafts stay outside the queue", async () => {
  const original = fixture(), input = draft();
  const written = await commit(original, { type: "write-draft", draft: input, expectedDraftVersion: 0 });
  assert.equal(written.queue, original.queue);
  const saved = await commit(written, { type: "save", draft: { ...input, version: 1 } });
  assert.equal(pending(saved).length, 1);
  const [change] = pending(saved);
  assert.equal(change.versionId, saved.receipt.versionId);
  assert.equal(change.generation, 1);
  assert.equal(change.previousOperationId, null);
  assert.equal(JSON.stringify(saved.queue).includes(input.content.body), false);
  assert.deepEqual(sync.assertWritingSyncState(JSON.parse(JSON.stringify(saved.queue))), saved.queue);
});

test("stable retry identity never duplicates or backfills already accepted local operations", async () => {
  const saved = await save();
  const replay = await commit(saved, saved.command);
  assert.equal(replay.queue, saved.queue);
  const receipt = ack(pending(saved)[0]);
  saved.queue = sync.acknowledgeWritingChanges(saved.queue, [receipt]);
  assert.equal((await commit(saved, saved.command)).queue, saved.queue);
  const oldWithoutQueue = { ...saved, queue: sync.createWritingSyncState(owner) };
  assert.equal(pending(await commit(oldWithoutQueue, saved.command)).length, 0);
});

test("no-op saves, idempotent lifecycle actions, discarded and conflicting drafts do not queue", async () => {
  let pair = await save();
  let entry = Object.values(pair.state.entries)[0];
  pair = await save(pair, draft(entry));
  assert.equal(pair.receipt.outcome, "unchanged");
  assert.equal(pending(pair).length, 1);
  const stale = draft(entry, "Competing words");
  pair = await save(pair, draft(entry, "Newer words"));
  pair = await save(pair, stale);
  assert.equal(pair.receipt.outcome, "conflict");
  assert.equal(pending(pair).length, 2);
  const conflictDraft = pair.state.drafts[pair.receipt.draftId];
  pair = await commit(pair, { type: "discard-draft", draftId: conflictDraft.id, expectedDraftVersion: conflictDraft.version });
  assert.equal(pending(pair).length, 2);
  entry = Object.values(pair.state.entries)[0];
  pair = await commit(pair, { type: "trash", entryId: entry.id, expectedGeneration: entry.generation });
  const length = pending(pair).length;
  pair = await commit(pair, { type: "trash", entryId: entry.id, expectedGeneration: entry.generation + 1 });
  assert.equal(pending(pair).length, length);
});

test("clearing, Trash, restore and permanent deletion retain ordered non-content markers", async () => {
  let pair = await save();
  let entry = Object.values(pair.state.entries)[0];
  pair = await save(pair, draft(entry, ""));
  assert.equal(Object.values(pair.state.entries)[0].versions.at(-1).content.body, "");
  for (const type of ["trash", "restore", "trash", "delete"]) {
    entry = Object.values(pair.state.entries)[0];
    pair = await commit(pair, { type, entryId: entry.id, expectedGeneration: entry.generation, ...(type === "delete" ? { confirmed: true } : {}) });
  }
  const changes = pending(pair);
  assert.deepEqual(changes.map((c) => c.kind), ["saved", "saved", "trashed", "restored", "trashed", "deleted"]);
  for (let i = 1; i < changes.length; i++) assert.equal(changes[i].previousOperationId, changes[i - 1].operationId);
  assert.equal(changes.at(-1).versionId, null);
  assert.equal(JSON.stringify(pair).includes("Synthetic saved words"), false);
});

test("acknowledging an in-flight older change leaves the newer save and draft untouched", async () => {
  let pair = await save();
  const first = pending(pair)[0], receipt = ack(first);
  pair = await save(pair, draft(Object.values(pair.state.entries)[0], "A newer version"));
  const open = draft(Object.values(pair.state.entries)[0], "Unsaved private draft");
  pair = await commit(pair, { type: "write-draft", draft: open, expectedDraftVersion: 0 });
  const state = structuredClone(pair.state);
  pair.queue = sync.acknowledgeWritingChanges(pair.queue, [receipt]);
  assert.equal(pending(pair).length, 1);
  assert.equal(pending(pair)[0].generation, 2);
  assert.deepEqual(pair.state, state);
  assert.deepEqual(sync.acknowledgeWritingChanges(pair.queue, [receipt]), pair.queue);
  assert.throws(() => sync.acknowledgeWritingChanges(pair.queue, [{ ...receipt, receiptId: "changed" }]), /changed on retry/);
});

test("bad owner, hash, generation, entry and unknown acknowledgements never retire work", async () => {
  const pair = await save(), receipt = ack(pending(pair)[0]), before = structuredClone(pair.queue);
  for (const overrides of [{ owner: "account:other" }, { fingerprint: "0".repeat(64) }, { generation: 999 },
    { entryId: "wrong-entry" }, { operationId: "unknown-op" }, { serverVersion: 0 }, { extra: "hidden text" }]) {
    assert.throws(() => sync.acknowledgeWritingChanges(pair.queue, [{ ...receipt, ...overrides }]));
    assert.deepEqual(pair.queue, before);
  }
  assert.throws(() => sync.acknowledgeWritingChanges(pair.queue, [receipt, { ...receipt, operationId: "unknown-op" }]));
  assert.deepEqual(pair.queue, before, "a partial batch cannot leak acceptance");
});

test("late exact receipts can arrive out of order without broad retirement or clock ordering", async () => {
  let pair = await save();
  pair = await save(pair, draft(Object.values(pair.state.entries)[0], "Next version"));
  const [first, second] = pending(pair);
  const afterSecond = sync.acknowledgeWritingChanges(pair.queue, [ack(second)]);
  assert.equal(sync.pendingWritingChanges(afterSecond)[0].operationId, first.operationId);
  const complete = sync.acknowledgeWritingChanges(afterSecond, [ack(first)]);
  assert.equal(sync.pendingWritingChanges(complete).length, 0);
  assert.throws(() => sync.acknowledgeWritingChanges(afterSecond, [ack(first, { serverVersion: second.sequence })]), /versions disagree/);
});

test("duplicate server receipt IDs, corrupt stores, reserved IDs and unsupported owners fail closed", async () => {
  let pair = await save();
  pair = await save(pair, draft(Object.values(pair.state.entries)[0], "Second"));
  const [first, second] = pending(pair), receipt = ack(first);
  assert.throws(() => sync.acknowledgeWritingChanges(pair.queue, [receipt, ack(second, { receiptId: receipt.receiptId })]), /Duplicate/);
  for (const mutate of [q => { q.schemaVersion = 2; }, q => { q.owner = "account:other"; },
    q => { q.pending[first.operationId].body = "Hidden text"; }, q => { q.extra = "Hidden text"; },
    q => { q.pending[first.operationId].entryId = "__proto__"; }]) {
    const corrupt = structuredClone(pair.queue); mutate(corrupt);
    assert.throws(() => sync.assertWritingSyncState(corrupt, owner));
  }
  assert.throws(() => sync.createWritingSyncState("legacy"));
  assert.throws(() => sync.createWritingSyncState("signed-out"));
});

test("all saved writing kinds use the same queue without sending question or draft text", async () => {
  for (const kind of ["note", "thought", "deep-thought", "reading-answer"]) {
    const pair = await save(fixture(), draft(null, "Private " + kind, kind));
    assert.equal(pending(pair).length, 1);
    assert.equal(JSON.stringify(pair.queue).includes("Private"), false);
  }
});
