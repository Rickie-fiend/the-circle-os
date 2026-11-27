import assert from "node:assert/strict";
import { test } from "node:test";
import { createEmptyState } from "../app/os/circle-os-model.js";
import { retireBundledRuns } from "../app/os/chapters/retire-bundled-runs.js";

test("bundled cleanup is repeatable and preserves authored or ambiguous records", () => {
  const state = createEmptyState();
  const oldRun = { runId: "day-one@1", chapterId: "day-one", chapterVersion: 1, status: "completed", answers: ["old"] };
  const unfinished = { runId: "athena-checkin-happy@2", chapterId: "athena-checkin-happy", chapterVersion: 2, status: "in-progress" };
  const build = { runId: "habit-building@1", chapterId: "habit-building", chapterVersion: 1, status: "completed" };
  const newer = { ...oldRun, runId: "day-one@4", chapterVersion: 4 };
  const catalog = { runId: "published@1", chapterId: "published", chapterVersion: 1, catalogKind: "lesson" };
  state.chapters.runs = Object.fromEntries([oldRun, unfinished, build, newer, catalog].map(run => [run.runId, run]));
  state.chapters.sessions = { retired: { activeRunId: oldRun.runId }, catalog: { activeRunId: catalog.runId } };
  state.habits.definitions = {
    "chapter-run:habit-building@1": { setupRunId: build.runId },
    manual: { setupRunId: build.runId },
  };
  const goal = "goal-day-one-2026-11-26";
  const step = "step-day-one-2026-11-26";
  state.goals.items = { [goal]: { id: goal }, manual: { id: "manual" } };
  state.goals.steps = { [step]: { id: step, goalId: goal, taskId: "starter" } };
  state.tasks.items = { starter: {}, manual: {} };
  state.protocol.runs = { unknownPhase: {} };
  const before = structuredClone(state);
  const isBundledVersion = (id, version) => [oldRun, unfinished, build, catalog]
    .some(run => run.chapterId === id && run.chapterVersion === version);

  const cleaned = retireBundledRuns(state, isBundledVersion);
  assert.deepEqual(state, before);
  assert.deepEqual(cleaned.chapters.runs, { [newer.runId]: newer, [catalog.runId]: catalog });
  assert.deepEqual(cleaned.chapters.sessions, { catalog: state.chapters.sessions.catalog });
  assert.deepEqual(cleaned.habits.definitions, { manual: state.habits.definitions.manual });
  assert.deepEqual(cleaned.goals.items, { manual: state.goals.items.manual });
  assert.deepEqual(cleaned.goals.steps, {});
  assert.deepEqual(cleaned.tasks.items, { manual: state.tasks.items.manual });
  assert.deepEqual(cleaned.protocol.runs, state.protocol.runs);
  assert.equal(retireBundledRuns(cleaned, isBundledVersion), cleaned);
});
