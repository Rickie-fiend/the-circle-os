import assert from "node:assert/strict";
import test from "node:test";
import { applyWritingOperation, createWritingState, prepareWritingOperation } from "../app/os/writing-model.js";
import { projectWritingImprint, recordWritingImprint, writingFadeAt } from "../app/os/home/imprint-writing-activity.ts";

test("Imprint follows accepted first saves, retries, edits and source removal", async () => {
  const owner = "account:imprint-test";
  let state = createWritingState(owner);
  let id = 0;
  const early = "2026-11-20T23:10:00.000Z";
  const later = "2026-11-21T02:00:00.000Z";
  const day = "2026-11-20";
  const timeZone = "Asia/Bangkok";
  const send = async (operation, at, capture = true) => {
    const command = { ...operation, owner, at, operationId: operation.operationId ?? `op-${++id}` };
    const result = applyWritingOperation(state, await prepareWritingOperation(command));
    const pulse = capture ? recordWritingImprint(state, result) : null;
    state = result.state;
    return { command, pulse };
  };
  const save = async (entryId, title, at, capture = true) => {
    const entry = state.entries[entryId];
    const draft = {
      id: `draft-${id + 1}`, entryId, kind: "note", source: null, startedAt: entry?.startedAt ?? at,
      attribution: { day, timeZone, occurrenceAt: null }, content: { title, body: "", tags: [] },
      baseGeneration: entry?.generation ?? 0, baseVersionId: entry?.currentVersionId ?? null,
    };
    await send({ type: "write-draft", draft, expectedDraftVersion: 0 }, at);
    return send({ type: "save", draft: { ...draft, version: 1 } }, at, capture);
  };
  const lifecycle = (entryId, type) => send({ type, entryId, expectedGeneration: state.entries[entryId].generation, ...(type === "delete" && { confirmed: true }) }, later);

  await save("older", "An existing Note", early, false);
  assert.equal((await save("older", "Edited existing Note", later)).pulse, null);
  assert.deepEqual(projectWritingImprint(state), []);
  const first = await save("first", "New Note", early);
  assert.equal(first.pulse, "notes");
  assert.equal((await send(first.command, early)).pulse, null);
  assert.equal((await save("second", "Second Note", later)).pulse, "notes");
  assert.equal(projectWritingImprint(state).length, 1);
  assert.deepEqual(projectWritingImprint(state)[0].sources, ["first", "second"]);
  assert.equal(projectWritingImprint(state)[0].at, early);

  await lifecycle("first", "trash");
  await lifecycle("first", "delete");
  assert.deepEqual(projectWritingImprint(state)[0].sources, ["second"]);
  assert.equal(projectWritingImprint(state)[0].at, early);
  assert.equal((await save("second", "", later)).pulse, null);
  assert.deepEqual(projectWritingImprint(state), []);
  assert.equal((await save("second", "Refilled Note", later)).pulse, null);
  assert.equal(projectWritingImprint(state)[0].at, early);
  await lifecycle("second", "trash");
  assert.deepEqual(projectWritingImprint(state), []);
  assert.equal((await lifecycle("second", "restore")).pulse, null);
  assert.equal(projectWritingImprint(state)[0].at, early);
  await lifecycle("second", "trash");
  await lifecycle("second", "delete");
  assert.deepEqual(state.imprint, { days: {}, sources: {} });
});

test("fade uses the save timezone, an elapsed day and the local 06:00 cutoff", () => {
  assert.equal(writingFadeAt("2026-11-20T23:00:00.000Z", "Asia/Bangkok"), Date.parse("2026-11-21T23:00:00Z"));
  assert.equal(writingFadeAt("2026-11-20T23:00:00.001Z", "Asia/Bangkok"), Date.parse("2026-11-22T23:00:00Z"));
  assert.equal(writingFadeAt("2026-03-07T11:00:00.000Z", "America/New_York"), Date.parse("2026-03-09T10:00:00Z"));
  assert.equal(writingFadeAt("2026-10-31T10:00:00.000Z", "America/New_York"), Date.parse("2026-11-01T11:00:00Z"));
});
