import assert from "node:assert/strict";
import test from "node:test";
import { weekHistory } from "../app/os/week-history.js";
import { createEmptyState, normalizeState } from "../app/os/circle-os-model.js";

function fixture() {
  const state = createEmptyState();
  state.weeks["2020-01-06"] = { weekKey: "2020-01-06", kept: false, fed: "", moved: "A small start", blocked: "", keep: "Try again", reviewedAt: "2020-01-12T14:00:00Z" };
  state.goals.items.old = { id: "old", scope: "week", dateKey: "2020-01-06", text: "Old goal", status: "done", createdAt: "2020-01-06T01:00:00Z" };
  state.goals.steps.step = { id: "step", goalId: "old", taskId: "task", dateKey: "2020-01-07", createdAt: "2020-01-06T01:00:00Z" };
  state.tasks.items.task = { id: "task", text: "Linked words", status: "archived" };
  return state;
}

test("saved weeks include goals-only and reviews-only, exclude blank/current/future/invalid weeks", () => {
  const state = fixture();
  for (const key of ["2026-10-26", "2026-11-02", "2026-11-09", "2026-02-30", "2026-10-27", "invalid"]) state.weeks[key] = { ...state.weeks["2020-01-06"], weekKey: key };
  state.goals.items.new = { ...state.goals.items.old, id: "new", text: "Goal only", dateKey: "2026-10-19" };
  state.goals.items.blank = { ...state.goals.items.old, id: "blank", text: " ", dateKey: "2026-10-12" };
  const before = structuredClone(state);
  const result = weekHistory(state, "2026-11-05");
  assert.deepEqual(result.map(item => item.weekKey), ["2026-10-26", "2026-10-19", "2020-01-06"]);
  assert.equal(result[0].goals.length, 0); assert.equal(result[1].review, null);
  assert.deepEqual(state, before);
});

test("history reads linked task words/status, preserves missing and archived steps, makes no copies in storage", () => {
  const state = fixture(), before = structuredClone(state);
  let result = weekHistory(state, "2026-11-05");
  assert.equal(result[0].goals[0].steps[0].status, "archived");
  assert.equal(result[0].goals[0].done, true);
  result[0].goals[0].text = "Read model mutation"; result[0].review.moved = "Read model mutation";
  assert.deepEqual(state, before);
  state.tasks.items.task.text = "Latest saved wording";
  assert.equal(weekHistory(state, "2026-11-05")[0].goals[0].steps[0].text, "Latest saved wording");
  delete state.tasks.items.task;
  result = weekHistory(state, "2026-11-05");
  assert.equal(result[0].goals[0].steps[0].status, "missing");
  assert.equal(result[0].goals[0].steps[0].text, "");
});

test("normalization/reload retains review answers and historical assignment without new evidence", () => {
  const state = normalizeState(fixture()), before = structuredClone(state);
  assert.deepEqual(weekHistory(normalizeState(JSON.parse(JSON.stringify(state))), "2026-11-05"), weekHistory(state, "2026-11-05"));
  assert.deepEqual(state, before);
  assert.equal(weekHistory(state, "2020-01-12").length, 0);
  assert.equal(weekHistory(state, "2020-01-13").length, 1);
  assert.deepEqual(weekHistory(createEmptyState(), "2026-11-05"), []);
});
