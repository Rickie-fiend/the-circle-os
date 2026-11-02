import assert from "node:assert/strict";
import test from "node:test";
import {
  applyWritingOperation, assertWritingState, createWritingState, prepareWritingOperation,
  writingAttribution, writingDrafts, writingEvidence, writingHistory, writingVersions,
} from "../app/os/writing-model.js";

const owner = "account:synthetic-a";
const at = "2026-11-02T03:00:00.000Z";
const later = "2026-11-02T03:10:00.000Z";
function draft(overrides = {}) {
  const entryId = overrides.entryId || crypto.randomUUID();
  return { id: crypto.randomUUID(), entryId, kind: "note", baseVersionId: null, baseGeneration: 0,
    startedAt: at, attribution: writingAttribution(at, "Asia/Bangkok"),
    content: { title: "", body: "Synthetic writing", tags: [] }, source: null, ...overrides };
}
async function run(state, type, values, operationId = crypto.randomUUID(), recordedAt = at) {
  const command = { owner: state.owner, operationId, at: recordedAt, type, ...values };
  return { ...applyWritingOperation(state, await prepareWritingOperation(command)), command };
}
async function start(input = draft(), state = createWritingState(owner)) {
  return run(state, "write-draft", { draft: input, expectedDraftVersion: 0 });
}
async function save(state, input, operationId) {
  return run(state, "save", { draft: input }, operationId, later);
}
async function fixture(overrides = {}) {
  const input = draft(overrides), written = await start(input);
  const saved = await save(written.state, written.state.drafts[input.id]);
  return { ...saved, input, entry: saved.state.entries[input.entryId] };
}
function correction(entry, overrides = {}) {
  const current = entry.versions.at(-1);
  return draft({ entryId: entry.id, kind: entry.kind, source: entry.source, startedAt: entry.startedAt,
    baseVersionId: entry.currentVersionId, baseGeneration: entry.generation,
    attribution: current.attribution, content: { ...current.content, body: "Corrected synthetic writing" }, ...overrides });
}

test("drafts are recovered data, outside saved history and evidence", async () => {
  const result = await start();
  assert.equal(writingDrafts(result.state).length, 1);
  assert.deepEqual(writingHistory(result.state), []);
  assert.deepEqual(writingEvidence(result.state), []);
  assert.equal(result.receipt.outcome, "drafted");
});

test("an absent title displays Untitled without becoming authored evidence", async () => {
  const result = await fixture();
  assert.equal(writingHistory(result.state)[0].title, "Untitled");
  assert.equal(writingEvidence(result.state)[0].content.title, "");
  assert.equal(writingDrafts(result.state).length, 0);
  assert.equal(writingVersions(result.state, result.input.entryId).length, 1);
});

test("empty/default-label-only writing cannot save; user title-only and body-only writing can", async () => {
  const empty = draft({ content: { title: " ", body: "\n ", tags: [] } });
  const written = await start(empty);
  await assert.rejects(save(written.state, written.state.drafts[empty.id]), /Write something/);
  assert.equal(writingDrafts(written.state).length, 1);
  for (const content of [{ title: "Untitled", body: "", tags: [] }, { title: "", body: "Body only", tags: [] }]) {
    const result = await fixture({ content });
    assert.equal(writingHistory(result.state).length, 1);
  }
});

test("two identical Notes on one day retain separate identities", async () => {
  const first = await fixture();
  const second = draft(), written = await start(second, first.state);
  const saved = await save(written.state, written.state.drafts[second.id]);
  const entries = writingHistory(saved.state);
  assert.equal(entries.length, 2); assert.notEqual(entries[0].id, entries[1].id);
  assert.equal(entries[0].attribution.day, entries[1].attribution.day);
});

test("saved corrections preserve versions; typing itself creates none", async () => {
  const first = await fixture(), input = correction(first.entry);
  const written = await start(input, first.state);
  assert.equal(writingVersions(written.state, first.entry.id).length, 1);
  const second = await save(written.state, written.state.drafts[input.id]);
  const versions = writingVersions(second.state, first.entry.id);
  assert.deepEqual(versions.map(v => v.content.body), ["Corrected synthetic writing", "Synthetic writing"]);
  assert.equal(writingEvidence(second.state).length, 1);
  assert.equal(writingEvidence(second.state)[0].versionId, versions[0].id);
  assert.equal(writingHistory(first.state)[0].content.body, "Synthetic writing", "prior input state stays unchanged");
  versions[0].content.body = "Mutated read view";
  assert.equal(writingVersions(second.state, first.entry.id)[0].content.body, "Corrected synthetic writing");
});

test("unchanged saves, including tag ordering, add no version", async () => {
  const first = await fixture({ content: { title: "A", body: "Body", tags: ["b", "a", "a"] } });
  const input = correction(first.entry, { content: { title: "A", body: "Body", tags: ["a", "b"] } });
  const written = await start(input, first.state), saved = await save(written.state, written.state.drafts[input.id]);
  assert.equal(saved.receipt.outcome, "unchanged");
  assert.equal(writingVersions(saved.state, first.entry.id).length, 1);
  assert.equal(writingDrafts(saved.state).length, 0);
});

test("same-operation retry returns its receipt; changed content with that ID is refused", async () => {
  const input = draft(), written = await start(input), snapshot = written.state.drafts[input.id];
  const saved = await save(written.state, snapshot, "save-once");
  const retried = applyWritingOperation(saved.state, await prepareWritingOperation(saved.command));
  assert.deepEqual(retried.receipt, saved.receipt);
  assert.equal(writingVersions(retried.state, input.entryId).length, 1);
  await assert.rejects(save(saved.state, { ...snapshot, content: { ...snapshot.content, body: "Different" } }, "save-once"), /already used/);
});

test("preparation captures caller data before hashing and cannot be bypassed", async () => {
  const state = createWritingState(owner), input = draft();
  const command = { owner, operationId: "capture", at, type: "write-draft", expectedDraftVersion: 0, draft: input };
  const pending = prepareWritingOperation(command); input.content.body = "Later caller mutation";
  const prepared = await pending;
  assert.equal(applyWritingOperation(state, prepared).state.drafts[input.id].content.body, "Synthetic writing");
  assert.throws(() => applyWritingOperation(state, { command, fingerprint: "0".repeat(64) }), /Prepare/);
});

test("a conflicting saved correction keeps both accepted and candidate text", async () => {
  const first = await fixture(), a = correction(first.entry), b = correction(first.entry, { content: { title: "", body: "Other tab", tags: [] } });
  let state = (await start(a, first.state)).state; state = (await start(b, state)).state;
  state = (await save(state, state.drafts[a.id])).state;
  const conflicted = await save(state, state.drafts[b.id]);
  assert.equal(conflicted.receipt.outcome, "conflict");
  assert.equal(writingHistory(conflicted.state)[0].content.body, "Corrected synthetic writing");
  assert.ok(writingDrafts(conflicted.state).some(d => d.content.body === "Other tab"));
  assert.equal(writingDrafts(conflicted.state).filter(d => d.content.body === "Other tab").length, 1, "one recoverable candidate, not a duplicate draft");
  assert.equal(writingVersions(conflicted.state, first.entry.id).length, 2);
  const candidate = conflicted.state.drafts[conflicted.receipt.draftId];
  const current = conflicted.state.entries[first.entry.id];
  const chosen = await run(conflicted.state, "write-draft", { expectedDraftVersion: candidate.version,
    draft: { ...candidate, baseVersionId: current.currentVersionId, baseGeneration: current.generation } });
  const resolved = await save(chosen.state, chosen.state.drafts[candidate.id]);
  assert.equal(writingHistory(resolved.state)[0].content.body, "Other tab");
});

test("stale same-draft writes preserve the newer draft and their own candidate", async () => {
  const input = draft(), first = await start(input);
  const next = await run(first.state, "write-draft", { draft: { ...input, content: { ...input.content, body: "Newer" } }, expectedDraftVersion: 1 });
  const stale = await run(next.state, "write-draft", { draft: { ...input, content: { ...input.content, body: "Competing" } }, expectedDraftVersion: 1 });
  assert.equal(stale.receipt.outcome, "conflict");
  assert.deepEqual(writingDrafts(stale.state).map(d => d.content.body).sort(), ["Competing", "Newer"]);
});

for (const saveFirst of [false, true]) test(`typing during Save survives when Save commits ${saveFirst ? "before" : "after"} its draft update`, async () => {
  const input = draft(), written = await start(input), snapshot = written.state.drafts[input.id];
  const update = { draft: { ...snapshot, content: { ...snapshot.content, body: "Typed while saving" } }, expectedDraftVersion: snapshot.version };
  let state = written.state;
  if (saveFirst) { state = (await save(state, snapshot)).state; state = (await run(state, "write-draft", update)).state; }
  else { state = (await run(state, "write-draft", update)).state; state = (await save(state, snapshot)).state; }
  assert.equal(writingHistory(state)[0].content.body, "Synthetic writing");
  const pending = writingDrafts(state)[0];
  assert.equal(pending.content.body, "Typed while saving");
  state = (await save(state, pending)).state;
  assert.equal(writingHistory(state)[0].content.body, "Typed while saving");
  assert.equal(writingVersions(state, input.entryId).length, 2);
});

test("discard removes unsaved changes, preserves saved content, and closes stale writes", async () => {
  const first = await fixture(), input = correction(first.entry), written = await start(input, first.state);
  const result = await run(written.state, "discard-draft", { draftId: input.id, expectedDraftVersion: 1 });
  assert.equal(writingDrafts(result.state).length, 0);
  assert.equal(writingHistory(result.state)[0].content.body, "Synthetic writing");
  await assert.rejects(run(result.state, "write-draft", { draft: input, expectedDraftVersion: 1 }), /discarded/);
});

test("stale discard does not erase later writing", async () => {
  const input = draft(), first = await start(input);
  const next = await run(first.state, "write-draft", { draft: { ...input, content: { ...input.content, body: "Later" } }, expectedDraftVersion: 1 });
  const discard = await run(next.state, "discard-draft", { draftId: input.id, expectedDraftVersion: 1 });
  assert.equal(discard.receipt.outcome, "conflict");
  assert.equal(writingDrafts(discard.state)[0].content.body, "Later");
});

test("05:50 writing saved at 06:10 retains starting Circle day and actual save time", async () => {
  const startedAt = "2026-11-02T22:50:00.000Z", savedAt = "2026-11-02T23:10:00.000Z";
  const input = draft({ startedAt, attribution: writingAttribution(startedAt, "Asia/Bangkok") });
  const written = await start(input);
  const result = await run(written.state, "save", { draft: written.state.drafts[input.id] }, "boundary-save", savedAt);
  assert.equal(writingHistory(result.state)[0].attribution.day, "2026-11-02");
  assert.equal(result.state.entries[input.entryId].createdAt, savedAt);
  assert.equal(writingVersions(result.state, input.entryId)[0].savedAt, savedAt);
  assert.equal(writingAttribution(savedAt, "Asia/Bangkok").day, "2026-11-03");
});

test("Circle attribution uses local 06:00 across both DST transitions", () => {
  for (const [time, expected] of [
    ["2026-03-08T09:59:00.000Z", "2026-03-07"], ["2026-03-08T10:00:00.000Z", "2026-03-08"],
    ["2026-11-01T10:59:00.000Z", "2026-10-31"], ["2026-11-01T11:00:00.000Z", "2026-11-01"],
  ]) assert.equal(writingAttribution(time, "America/New_York").day, expected);
});

test("timestamps require explicit canonical UTC and named timezones rather than guessing", () => {
  for (const time of ["2026-11-02T03:00:00", "2026-02-30T03:00:00.000Z", "2026-11-02T03:00:00+07:00"]) {
    assert.throws(() => writingAttribution(time, "UTC"), /recording time/);
  }
  assert.throws(() => writingAttribution(at, "+07:00"), /timezone/);
});

test("travel does not move saved writing; deliberate backdating is a new version with unknown occurrence time", async () => {
  const first = await fixture(), input = correction(first.entry, { attribution: { day: "2026-10-30", timeZone: "Asia/Bangkok", occurrenceAt: null } });
  writingAttribution(later, "America/Los_Angeles");
  assert.equal(writingHistory(first.state)[0].attribution.timeZone, "Asia/Bangkok");
  const written = await start(input, first.state), result = await save(written.state, written.state.drafts[input.id]);
  assert.equal(writingHistory(result.state)[0].attribution.day, "2026-10-30");
  assert.equal(writingVersions(result.state, input.entryId)[1].attribution.day, "2026-11-02");
  assert.equal(writingHistory(result.state)[0].attribution.occurrenceAt, null);
  assert.equal(writingVersions(result.state, input.entryId)[0].savedAt, later);
});

for (const kind of ["thought", "deep-thought", "reading-answer"]) test(`${kind} corrections keep source links and one evidence entry`, async () => {
  const originalSource = kind === "thought" ? null : { questionId: "q-1", question: "What did you notice?", source: "synthetic", readingId: "reading-1", editionId: "edition-1" };
  const first = await fixture({ kind, source: originalSource }), input = correction(first.entry);
  const written = await start(input, first.state), saved = await save(written.state, written.state.drafts[input.id]);
  assert.deepEqual(writingEvidence(saved.state)[0].source, originalSource);
  assert.equal(writingEvidence(saved.state).length, 1);
  assert.equal(writingHistory(saved.state)[0].title, null);
  assert.equal(writingVersions(saved.state, first.entry.id).length, 2);
  if (originalSource) await assert.rejects(start(correction(saved.state.entries[first.entry.id], { source: { ...originalSource, question: "Different question" } }), saved.state), /original writing source/);
});

test("Trash/Restore retain identity and versions; stale lifecycle actions do not retick state", async () => {
  const first = await fixture();
  const trash = await run(first.state, "trash", { entryId: first.entry.id, expectedGeneration: first.entry.generation });
  assert.deepEqual(writingEvidence(trash.state), []); assert.deepEqual(writingHistory(trash.state), []);
  assert.equal(writingHistory(trash.state, { status: "trashed" })[0].id, first.entry.id);
  const stale = await run(trash.state, "restore", { entryId: first.entry.id, expectedGeneration: first.entry.generation });
  assert.equal(stale.receipt.outcome, "conflict");
  const restored = await run(stale.state, "restore", { entryId: first.entry.id, expectedGeneration: trash.receipt.generation });
  assert.equal(writingHistory(restored.state)[0].id, first.entry.id);
  assert.deepEqual(writingVersions(restored.state, first.entry.id), writingVersions(first.state, first.entry.id));
});

test("Trash hides associated edit drafts until Restore without erasing them", async () => {
  const first = await fixture(), input = correction(first.entry), written = await start(input, first.state);
  const trash = await run(written.state, "trash", { entryId: first.entry.id, expectedGeneration: 1 });
  assert.deepEqual(writingDrafts(trash.state), []);
  const restored = await run(trash.state, "restore", { entryId: first.entry.id, expectedGeneration: 2 });
  assert.equal(writingDrafts(restored.state)[0].content.body, "Corrected synthetic writing");
});

test("permanent deletion requires Trash and confirmation, scrubs content and rejects stale resurrection", async () => {
  const first = await fixture({ content: { title: "private-synthetic-title", body: "private-synthetic-body", tags: ["private-synthetic-tag"] }, source: { question: "private-synthetic-question" } });
  const input = correction(first.entry), written = await start(input, first.state);
  await assert.rejects(run(written.state, "delete", { entryId: first.entry.id, expectedGeneration: 1 }), /Confirm/);
  await assert.rejects(run(written.state, "delete", { entryId: first.entry.id, expectedGeneration: 1, confirmed: true }), /Trash/);
  const trash = await run(written.state, "trash", { entryId: first.entry.id, expectedGeneration: 1 });
  const deleted = await run(trash.state, "delete", { entryId: first.entry.id, expectedGeneration: 2, confirmed: true });
  assert.deepEqual(writingHistory(deleted.state, { status: "trashed" }), []);
  assert.deepEqual(writingVersions(deleted.state, first.entry.id), []);
  assert.deepEqual(writingDrafts(deleted.state), []);
  assert.doesNotMatch(JSON.stringify(deleted.state), /private-synthetic/);
  const retry = applyWritingOperation(deleted.state, await prepareWritingOperation(first.command));
  assert.deepEqual(retry.receipt, first.receipt); assert.deepEqual(writingHistory(retry.state), []);
  await assert.rejects(save(deleted.state, written.state.drafts[input.id]), /permanently deleted/);
  await assert.rejects(start(draft({ entryId: first.entry.id }), deleted.state), /permanently deleted/);
  await assert.rejects(run(deleted.state, "restore", { entryId: first.entry.id, expectedGeneration: 3 }), /permanently deleted/);
});

test("schema/owner/corrupt data and unsafe identifiers fail closed", async () => {
  const state = createWritingState(owner);
  assert.throws(() => assertWritingState({ ...state, schemaVersion: 2 }), /version/);
  assert.throws(() => assertWritingState(state, "account:synthetic-b"), /another account/);
  assert.throws(() => assertWritingState({ ...state, entries: [] }), /Invalid writing store/);
  for (const badId of ["__proto__", "constructor", "../entry"]) await assert.rejects(start(draft({ entryId: badId })), /ID/);
  assert.throws(() => writingAttribution(at, "Unknown/Somewhere"), /not supported/);
  assert.throws(() => writingAttribution(at, ""), /timezone/);
  await assert.rejects(start(draft({ attribution: { day: "2026-02-30", timeZone: "UTC", occurrenceAt: null } })), /day/);
  await assert.rejects(start(draft({ kind: "thought", content: { title: "A title", body: "Body", tags: [] } })), /do not have titles/);
});
