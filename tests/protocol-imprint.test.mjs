import assert from "node:assert/strict";
import test from "node:test";
import {
  addProtocolItem, archiveProtocolRun, beginProtocolRun, createEmptyState, endProtocolRun,
  getDateKey, normalizeState, protocolSealId, sealProtocolDay, setProtocolDays,
  startProtocolDraft, toggleProtocolRecordItem, updateProtocolItem,
} from "../app/os/circle-os-model.js";
import { projectLocalImprint, protocolImprintSource } from "../app/os/home/imprint-local-activity.ts";

const day = "2020-01-01";
const startPhase = (state, runId, days = 3) => {
  state = startProtocolDraft(state, runId).state;
  state = setProtocolDays(state, runId, days);
  state = addProtocolItem(state, runId, "non-negotiable", `${runId}-term`).state;
  state = updateProtocolItem(state, runId, `${runId}-term`, "Read a page");
  state = addProtocolItem(state, runId, "negotiable", `${runId}-extra`).state;
  state = updateProtocolItem(state, runId, `${runId}-extra`, "Write a line");
  return beginProtocolRun(state, runId, day);
};
const action = (runId, hour) => ({
  id: `${runId}-${hour}`, runId, at: `${day}T${hour}:00:00Z`, timeZone: "Asia/Bangkok",
});
const project = (state) => projectLocalImprint(state.habits.completions, state.tasks, state.protocol.seals);

test("a tracked daily seal keeps its Circle day and original fade clock through correction and re-sealing", () => {
  const beforeSix = new Date(2020, 0, 2, 5, 59);
  assert.equal(getDateKey(beforeSix), day);
  beforeSix.setMinutes(60);
  assert.equal(getDateKey(beforeSix), "2020-01-02");
  const runId = "phase";
  const key = protocolSealId(runId, day);
  const first = action(runId, "21");
  let state = startPhase(createEmptyState(), runId);
  assert.strictEqual(sealProtocolDay(state, day, first), state);
  const toggle = (id) => { state = toggleProtocolRecordItem(state, runId, `${runId}-${id}`, day); };
  toggle("term");
  assert.deepEqual(project(state), []);
  assert.strictEqual(sealProtocolDay(state, day, action("another-phase", "21")), state);
  state = sealProtocolDay(state, day, first);
  const contribution = {
    group: "protocol", day, at: first.at, timeZone: first.timeZone,
    fadeAt: Date.parse("2020-01-03T06:00:00+07:00"), sources: [protocolImprintSource(key)],
  };
  assert.deepEqual(project(state), [contribution]);
  assert.strictEqual(sealProtocolDay(state, day, first), state);
  toggle("extra");
  assert.deepEqual(project(state), [contribution]);
  toggle("term");
  assert.deepEqual(project(state), []);
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  toggle("term");
  assert.deepEqual(project(state), []);
  assert.strictEqual(sealProtocolDay(state, day, first), state);
  const second = action(runId, "22");
  state = sealProtocolDay(state, day, second);
  assert.deepEqual(project(state), [contribution]);
  assert.equal(state.protocol.seals[key].sealedAt, second.at);
  assert.equal(state.protocol.seals[key].imprintOperation, second.id);

  state = endProtocolRun(state, runId);
  state = archiveProtocolRun(state, runId);
  assert.deepEqual(project(state), [contribution]);
});

test("only tracked seals count and two completed phases can support one Protocol day", () => {
  const seal = (state, runId, tracking) => {
    state = startPhase(state, runId, 1);
    state = toggleProtocolRecordItem(state, runId, `${runId}-term`, day);
    return sealProtocolDay(state, day, tracking);
  };
  let state = seal(createEmptyState(), "old");
  assert.equal(state.protocol.runs.old.status, "completed");
  assert.deepEqual(project(state), []);
  state = seal(state, "first", action("first", "01"));
  state = seal(state, "second", action("second", "02"));
  assert.equal(state.protocol.runs.second.status, "completed");
  const [contribution] = project(state);
  assert.equal(project(state).length, 1);
  assert.equal(contribution.at, action("first", "01").at);
  assert.deepEqual(contribution.sources, ["first", "second"].map(runId => protocolImprintSource(protocolSealId(runId, day))));
});
