import assert from "node:assert/strict";
import test from "node:test";
import {
  applyWritingOperation, createWritingState, prepareWritingOperation, writingAttribution,
} from "../app/os/writing-model.js";
import { buildWritingCompatibilityView, selectWritingMemory, writingConsumerMemory } from "../app/os/writing-compatibility-model.js";
import { createAthenaMemory, forgetAthenaEvidence, mergeAthenaMemory } from "../app/os/athena-memory-model.js";

const owner = "account:synthetic-a", at = "2026-11-02T03:00:00.000Z", later = "2026-11-03T03:00:00.000Z";
const collections = ["ledger", "tastes", "rhythms", "portrait", "curiosity"];
const empty = () => createWritingState(owner);
const answer = (questionId, text, kind = "thought", extra = {}) => ({ questionId, answer: text, kind, question: "Synthetic question?", ...extra });
const snapshot = answers => ({ owner, answers });
const view = (writingState = empty(), answers = [], links = []) => buildWritingCompatibilityView({ owner, writingState, existingWriting: snapshot(answers), links });
const ref = source => ({ owner: source.owner, sourceSystem: source.sourceSystem, sourceId: source.id, sourceType: source.kind, versionId: source.versionId, capturedAt: at });
const item = (refs, id = "synthetic-observation") => ({ id, statement: "A synthetic interpretation.", sourceRefs: refs, status: "active" });
const select = (current, memory) => selectWritingMemory({ owner, memory }, current);

test("permanent deletion keeps the question answered and first-use metadata without answer text", async () => {
  const first = await saved(empty(), { kind: "deep-thought", source: { questionId: "deep-original", question: "Original question?" } });
  const deleted = await life(await life(first, "trash"), "delete"), current = await view(deleted.state);
  assert.deepEqual(current.answeredQuestions, [{ questionId: "deep-original", question: "Original question?" }]);
  assert.deepEqual(current.hasSavedWriting, { note: false, thoughts: true });
  assert.equal(current.usageKnown, true); assert.equal(current.questionHistoryKnown, true);
  assert.equal(JSON.stringify(current).includes("Synthetic writing"), false);
  assert.deepEqual(current.sources, []);
  delete deleted.state.tombstones[first.id].usage;
  const unknown = await view(deleted.state);
  assert.equal(unknown.usageKnown, false); assert.equal(unknown.questionHistoryKnown, false);
  assert.deepEqual(unknown.answeredQuestions, []);
});

test("consumer memory keeps independent tool context and readings while excluding mixed/unknown or stale writing", async () => {
  const current = await view((await saved()).state), valid = ref(current.sources[0]);
  const good = item([valid], "duplicate"), bad = item([{ ...valid, versionId: "old" }], "duplicate");
  const day = item([{ sourceType: "day", sourceId: "day-1" }], "day");
  const mixed = item([valid, ...day.sourceRefs], "mixed"), unknown = item([{ sourceId: "unknown" }], "unknown");
  const memory = { ledger: [good, bad, day, mixed, unknown, { sourceRefs: day.sourceRefs }], reading: { cover: "Received prose." }, editions: [{ id: "received" }] };
  const projected = writingConsumerMemory({ owner, memory }, current);
  assert.deepEqual(projected.ledger, [good, day], "duplicate IDs cannot borrow a different item's valid dependencies");
  assert.deepEqual(projected.reading, memory.reading); assert.deepEqual(projected.editions, memory.editions);
  assert.deepEqual(writingConsumerMemory({ owner, memory }, null).ledger, [day], "loading withholds all writing-derived claims");
  assert.equal(memory.ledger.length, 6);
  const forgotten = writingConsumerMemory({ owner, memory: { ...memory, corrections: [{ action: "forget", sourceId: "day-1" }] } }, current);
  assert.deepEqual(forgotten.ledger, [good]);
});
async function run(state, type, values, operationId = crypto.randomUUID()) {
  const command = { owner, operationId, at: later, type, ...values };
  return { ...applyWritingOperation(state, await prepareWritingOperation(command)), command };
}
async function saved(state = empty(), overrides = {}) {
  const draft = { id: crypto.randomUUID(), entryId: crypto.randomUUID(), kind: "note", baseVersionId: null, baseGeneration: 0,
    startedAt: at, attribution: writingAttribution(at, "Asia/Bangkok"), content: { title: "", body: "Synthetic writing", tags: [] }, source: null, ...overrides };
  const written = await run(state, "write-draft", { draft, expectedDraftVersion: 0 });
  return { ...await run(written.state, "save", { draft: written.state.drafts[draft.id] }), id: draft.entryId };
}
async function corrected(first) {
  const entry = first.state.entries[first.id];
  return saved(first.state, { entryId: entry.id, kind: entry.kind, startedAt: entry.startedAt, source: entry.source,
    attribution: entry.versions.at(-1).attribution, baseVersionId: entry.currentVersionId, baseGeneration: entry.generation,
    content: { title: "", body: "Corrected synthetic writing", tags: [] } });
}
async function life(first, type) {
  return { ...await run(first.state, type, { entryId: first.id, expectedGeneration: first.state.entries[first.id].generation,
    ...(type === "delete" ? { confirmed: true } : {}) }), id: first.id };
}

test("existing Note fields form one preserved source without a guessed creation day", async () => {
  const answers = [answer("checkin-note", "  Original body\n", "note", { answeredAt: later }),
    answer("checkin-idle-title", "Original title", "note", { answeredAt: at })];
  const before = structuredClone(answers), current = await view(empty(), answers);
  assert.equal(current.sources.length, 1);
  const source = current.sources[0];
  assert.equal(source.id, "checkin-note"); assert.equal(source.content.body, "  Original body\n");
  assert.equal(source.content.title, "Original title"); assert.equal(source.startedAt, null);
  assert.deepEqual(source.attribution, { day: null, timeZone: null, occurrenceAt: null });
  assert.equal(source.lastRecordedAt, later);
  assert.deepEqual(source.aliases.map(value => value.sourceId).sort(), ["checkin-idle-title", "checkin-note"]);
  assert.deepEqual(answers, before);
  assert.equal(source.provenance.answers.length, 2);
});

test("missing and ambiguous existing timestamps remain unknown with original metadata retained", async () => {
  for (const answeredAt of [undefined, "2026-11-02 10:00", "2026-11-02T10:00:00+07:00", "invalid"]) {
    const old = answer("existing-thought", "Preserved text", "thought", answeredAt === undefined ? {} : { answeredAt });
    const source = (await view(empty(), [old])).sources[0];
    assert.equal(source.lastRecordedAt, null); assert.equal(source.attribution.day, null);
    assert.deepEqual(source.provenance.answers, [old]);
  }
});

test("title-only and body-only existing Notes survive while dated clearing stays empty", async () => {
  assert.equal((await view(empty(), [answer("checkin-idle-title", "Title only", "note")])).sources[0].content.body, "");
  const body = (await view(empty(), [answer("checkin-note", "Body only", "note")])).sources[0];
  assert.equal(body.content.title, ""); assert.equal(JSON.stringify(body).includes("Untitled"), false);
  assert.deepEqual((await view(empty(), [answer("checkin-note", "", "note", { answeredAt: at })])).sources, []);
});

test("Burmese, English and mixed writing retain exact Unicode and original question sources", async () => {
  const words = ["ဒီနေ့ စိတ်အေးတယ်။", "A quiet morning.", "ဒီနေ့ I felt calm.\nမနက်ဖြန်လည်း ရေးမယ်။"];
  const kinds = ["thought", "deep-thought", "athena-reading"];
  const answers = words.map((text, index) => answer(`question-${index}`, text, kinds[index], { source: "curiosity", target: "whatMatters" }));
  const current = await view(empty(), answers);
  assert.deepEqual(current.sources.map(source => source.content.body), words);
  assert.deepEqual(current.sources.map(source => source.kind), ["thought", "deep-thought", "reading-answer"]);
  assert.equal(current.sources[2].source.questionId, "question-2");
  assert.equal(current.sources[2].source.question, answers[2].question);
  assert.equal(current.sources[2].source.editionId, undefined, "unknown edition relationships are not reconstructed");
});

test("non-writing account/profile/tool fields never become writing evidence", async () => {
  const current = await view(empty(), [answer("profile-name", "Synthetic name", "profile"),
    answer("habit-action", "Walk", "habit"), { kind: "account", token: "synthetic-not-a-credential" }]);
  assert.deepEqual(current.sources, []); assert.deepEqual(current.answeredQuestions, []);
});

test("snapshots and links must explicitly match the current owner; legacy is never claimed", async () => {
  await assert.rejects(buildWritingCompatibilityView({ owner, writingState: empty(), existingWriting: { owner: "legacy", answers: [] } }), { code: "owner-mismatch" });
  await assert.rejects(buildWritingCompatibilityView({ owner, writingState: createWritingState("account:synthetic-b") }), { code: "owner-mismatch" });
  await assert.rejects(buildWritingCompatibilityView({ owner, writingState: empty(), existingWriting: { answers: [] } }), { code: "owner-mismatch" });
  const old = await buildWritingCompatibilityView({ owner: "legacy", writingState: createWritingState("legacy"), existingWriting: { owner: "legacy", answers: [answer("old", "Legacy text")] } });
  assert.equal(old.sources[0].owner, "legacy");
});

test("repeated read views are stable; an existing correction changes the fingerprint, not identity", async () => {
  const answers = [answer("checkin-note", "Body", "note"), answer("checkin-idle-title", "Title", "note")];
  const first = await view(empty(), answers), repeated = await view(empty(), [...answers].reverse());
  assert.deepEqual(repeated, first);
  const changed = await view(empty(), [answer("checkin-note", "Corrected body", "note"), answers[1]]);
  assert.equal(changed.sources[0].id, first.sources[0].id);
  assert.notEqual(changed.sources[0].versionId, first.sources[0].versionId);
});

test("identical distinct answers stay distinct, exact duplicates coalesce and competing IDs fail", async () => {
  const first = answer("one", "Same words"), second = answer("two", "Same words");
  assert.equal((await view(empty(), [first, second, { ...first }])).sources.length, 2);
  await assert.rejects(view(empty(), [first, answer("one", "Competing words")]), { code: "ambiguous-existing-writing" });
});

test("a view captures input before hashing and is deeply immutable", async () => {
  const answers = [answer("one", "Original words")], state = empty();
  const pending = view(state, answers);
  answers[0].answer = "Late mutation";
  const current = await pending;
  assert.equal(current.sources[0].content.body, "Original words");
  assert.throws(() => { current.sources[0].content.body = "Mutation"; }, TypeError);
  assert.throws(() => selectWritingMemory({ owner, memory: {} }, { ...current }), /Build the compatibility view/);
});

test("explicit links prevent double counting and never revive old text after Trash or deletion", async () => {
  let first = await saved();
  const old = [answer("checkin-note", "Older preserved words", "note")];
  const links = [{ owner, questionId: "checkin-note", entryId: first.id }];
  assert.equal((await view(first.state, old)).sources.length, 2);
  assert.equal((await view(first.state, old, links)).sources.length, 1);
  first = await life(first, "trash");
  assert.deepEqual((await view(first.state, old, links)).sources, []);
  first = await life(first, "delete");
  assert.deepEqual((await view(first.state, old, links)).sources, []);
  assert.equal(first.state.tombstones[first.id].generation > 0, true);
});

test("invalid, cross-owner and many-to-one mappings fail without changing records", async () => {
  const first = await saved(), before = structuredClone(first.state);
  await assert.rejects(view(first.state, [], [{ owner: "legacy", questionId: "old", entryId: first.id }]), { code: "owner-mismatch" });
  await assert.rejects(view(first.state, [], [{ owner, questionId: "old", entryId: "missing" }]), /known target/);
  await assert.rejects(view(first.state, [], ["one", "two"].map(questionId => ({ owner, questionId, entryId: first.id }))), /collapse/);
  assert.deepEqual(first.state, before);
});

test("the two existing Note IDs may share one target but cannot map to different entries", async () => {
  const first = await saved(), second = await saved(first.state);
  const answers = [answer("checkin-idle-title", "Title", "note"), answer("checkin-note", "Body", "note")];
  const ids = ["checkin-idle-title", "checkin-note"];
  const links = ids.map(questionId => ({ owner, questionId, entryId: first.id }));
  assert.equal((await view(second.state, answers, links)).sources.length, 2);
  await assert.rejects(view(second.state, answers, [links[0], { ...links[1], entryId: second.id }]), /different entries/);
});

test("drafts remain outside evidence and corrections expose only the current saved version", async () => {
  const first = await saved(), second = await corrected(first);
  const current = await view(second.state);
  assert.equal(current.sources.length, 1); assert.equal(current.sources[0].content.body, "Corrected synthetic writing");
  assert.equal(second.state.entries[first.id].versions.length, 2);
  const draft = { id: crypto.randomUUID(), entryId: crypto.randomUUID(), kind: "thought", baseVersionId: null, baseGeneration: 0,
    startedAt: at, attribution: writingAttribution(at, "Asia/Bangkok"), content: { title: "", body: "Unsaved secret", tags: [] }, source: null };
  const pending = await run(second.state, "write-draft", { draft, expectedDraftVersion: 0 });
  assert.equal(JSON.stringify(await view(pending.state)).includes("Unsaved secret"), false);
});

test("a stale successful Save receipt cannot reconstruct a deleted source", async () => {
  const first = await saved(), trashed = await life(first, "trash"), deleted = await life(trashed, "delete");
  const retry = applyWritingOperation(deleted.state, await prepareWritingOperation(first.command));
  assert.equal(retry.receipt.outcome, "saved");
  assert.deepEqual((await view(retry.state)).sources, []);
});

test("a trashed Deep Thought remains answered without copying its answer into question metadata", async () => {
  const first = await saved(empty(), { kind: "deep-thought", content: { title: "", body: "Private synthetic answer", tags: [] },
    source: { questionId: "deep-question", question: "Original question?", source: "local" } });
  const trashed = await life(first, "trash"), current = await view(trashed.state);
  assert.deepEqual(current.sources, []);
  assert.deepEqual(current.answeredQuestions, [{ questionId: "deep-question", question: "Original question?" }]);
  assert.equal(JSON.stringify(current).includes("Private synthetic answer"), false);
  assert.deepEqual(current.hasSavedWriting, { note: false, thoughts: true });
  const restored = await view((await life(trashed, "restore")).state);
  assert.equal(restored.sources[0].versionId, first.state.entries[first.id].currentVersionId);
  assert.deepEqual(restored.answeredQuestions, current.answeredQuestions);
});

test("correcting an answer retains one question status and produces no new outcome metadata", async () => {
  const first = await saved(empty(), { kind: "deep-thought", source: { questionId: "same-question", question: "Same question?" } });
  const current = await view((await corrected(first)).state);
  assert.equal(current.answeredQuestions.length, 1); assert.equal(current.sources.length, 1);
  assert.equal(current.outcome, undefined); assert.equal(current.sources[0].source.questionId, "same-question");
});

test("each writing-derived memory collection requires exact active source versions", async () => {
  const current = await view((await saved()).state), sourceRef = ref(current.sources[0]);
  const memory = Object.fromEntries(collections.map(collection => [collection, [item([sourceRef], collection)]]));
  const result = select(current, memory);
  assert.deepEqual(result.excluded, []);
  for (const collection of collections) assert.equal(result.context[collection].length, 1);
});

test("a correction invalidates old interpretation while preserving the new evidence and saved history", async () => {
  const first = await saved(), old = await view(first.state), second = await corrected(first), current = await view(second.state);
  const result = select(current, { ledger: [item([ref(old.sources[0])], "old"), item([ref(current.sources[0])], "current")] });
  assert.deepEqual(result.context.ledger.map(value => value.id), ["current"]);
  assert.equal(result.excluded[0].reason, "stale-or-excluded-source");
  assert.equal(second.state.entries[first.id].versions.length, 2);
});

test("Trash/deletion exclude dependent memory, and Restore permits the unchanged saved version", async () => {
  const first = await saved(), before = await view(first.state), memory = { ledger: [item([ref(before.sources[0])])] };
  const trashed = await life(first, "trash");
  assert.deepEqual(select(await view(trashed.state), memory).context.ledger, []);
  assert.equal(select(await view((await life(trashed, "restore")).state), memory).context.ledger.length, 1);
  assert.deepEqual(select(await view((await life(trashed, "delete")).state), memory).context.ledger, []);
});

test("wrong owner, unversioned, malformed and missing sources never authorize an interpretation", async () => {
  const current = await view((await saved()).state), valid = ref(current.sources[0]);
  const refs = [{ sourceId: valid.sourceId, sourceType: "note" }, { ...valid, owner: "account:synthetic-b" },
    { ...valid, versionId: undefined }, { ...valid, sourceSystem: "other" }, { ...valid, sourceId: "missing" }, null];
  const result = select(current, { ledger: [...refs.map((value, index) => item([value], `bad-${index}`)), item([], "no-sources")] });
  assert.deepEqual(result.context.ledger, []); assert.equal(result.excluded.length, refs.length + 1);
  assert.throws(() => selectWritingMemory({ owner: "account:synthetic-b", memory: {} }, current), { code: "owner-mismatch" });
});

test("a summary with one invalid dependency is withheld as a whole", async () => {
  const first = await saved(), second = await saved(first.state), before = await view(second.state);
  const current = await view((await life({ ...second, id: first.id }, "trash")).state);
  const mixed = item(before.sources.map(ref));
  const result = select(current, Object.fromEntries(collections.map(collection => [collection, [mixed]])));
  for (const collection of collections) assert.deepEqual(result.context[collection], []);
  assert.equal(result.excluded.length, collections.length);
  assert.equal(mixed.sourceRefs.length, 2, "selection does not rewrite a stale summary's dependencies");
});

test("a stale memory merge cannot undo an existing forget correction in the active view", async () => {
  const current = await view((await saved()).state), sourceRef = ref(current.sources[0]);
  const original = { ...createAthenaMemory(), ledger: [item([sourceRef])] };
  const removed = forgetAthenaEvidence(original, sourceRef.sourceId), merged = mergeAthenaMemory(removed, original);
  assert.equal(merged.ledger.length, 1, "legacy merge still retains its historical union");
  const result = select(current, merged);
  assert.deepEqual(result.context.ledger, []); assert.equal(result.excluded[0].reason, "forgotten-source");
});

test("forgetting one versioned dependency cannot silently revalidate a composite summary", async () => {
  const first = await saved(), second = await saved(first.state), current = await view(second.state);
  const original = { ...createAthenaMemory(), tastes: [item(current.sources.map(ref))] };
  const removed = forgetAthenaEvidence(original, first.id);
  assert.deepEqual(select(current, removed).context.tastes, []);
  assert.deepEqual(select(current, mergeAthenaMemory(removed, original)).context.tastes, []);
});

test("a malformed dependency cannot disappear during a versioned summary merge", async () => {
  const current = await view((await saved()).state);
  const merged = mergeAthenaMemory({}, { tastes: [item([ref(current.sources[0]), { sourceType: "note" }])] });
  assert.deepEqual(select(current, merged).context.tastes, []);
});

test("an explicit link cannot hide an existing Note behind a different writing kind", async () => {
  const first = await saved(empty(), { kind: "thought" });
  await assert.rejects(view(first.state, [answer("checkin-note", "Preserved Note", "note")],
    [{ owner, questionId: "checkin-note", entryId: first.id }]), /different kind/);
});

test("merged old and current version references cannot masquerade as current support", async () => {
  const first = await saved(), old = await view(first.state), current = await view((await corrected(first)).state);
  const merged = mergeAthenaMemory({ ledger: [item([ref(old.sources[0])])] }, { ledger: [item([ref(current.sources[0])])] });
  assert.equal(merged.ledger[0].sourceRefs.length, 2);
  assert.deepEqual(select(current, merged).context.ledger, []);
});

test("existing writing fingerprints also invalidate earlier derived context", async () => {
  const old = await view(empty(), [answer("existing", "Earlier words")]);
  const current = await view(empty(), [answer("existing", "Corrected words")]);
  assert.deepEqual(select(current, { ledger: [item([ref(old.sources[0])])] }).context.ledger, []);
  assert.equal(select(current, { ledger: [item([ref(current.sources[0])])] }).context.ledger.length, 1);
});

test("already suppressed observations remain excluded even after a stale status merge", async () => {
  const current = await view((await saved()).state), observation = item([ref(current.sources[0])]);
  const result = select(current, { portrait: [observation], corrections: [{ action: "suppress", targetId: observation.id }] });
  assert.deepEqual(result.context.portrait, []); assert.equal(result.excluded[0].reason, "suppressed");
});

test("received prose stays separate, unchanged and copy-isolated without publishing new editions", async () => {
  const current = await view(), memory = { ...createAthenaMemory(), reading: { cover: "An existing reading.", days: [] },
    editions: [{ id: "existing-edition", publishedAt: at, pages: { alive: [{ paragraphs: ["Old authored words."] }] } }],
    ledger: [item([{ sourceId: "old-unversioned" }])] };
  const before = structuredClone(memory), result = select(current, memory);
  assert.deepEqual(result.context.ledger, []);
  assert.deepEqual(result.readings, { reading: memory.reading, editions: memory.editions });
  assert.equal(Object.hasOwn(result.context, "reading"), false);
  result.readings.editions[0].pages.alive[0].paragraphs[0] = "Changed output copy";
  assert.deepEqual(memory, before);
});
