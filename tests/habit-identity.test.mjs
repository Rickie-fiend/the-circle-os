import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as circleModel from "../app/os/circle-os-model.js";

import {
  addHabitDefinition,
  createEmptyState,
  habitRowText,
  normalizeState,
  toggleHabitForDay,
  updateHabitDefinition,
  updateHabitDefinitionDraft,
  updateHabitDefinitionParts,
} from "../app/os/circle-os-model.js";
import { applyHabitBuildingCompletion } from "../app/os/habit-building-model.js";
import { createChapterRun, storeChapterRun } from "../app/os/chapters/chapter-model.js";
import { selectThoughtPrompt } from "../app/os/thought-prompt-model.js";

function recordedHabit() {
  const added = addHabitDefinition(createEmptyState(), "history-walk");
  const state = updateHabitDefinitionParts(added.state, added.id, {
    action: "Walk five minutes", cue: "after coffee", identity: "A steady walker",
  });
  return toggleHabitForDay(state, added.id, "2026-11-01");
}

test("one-click archive retains Habit evidence and Task wording through stale merge and reload", () => {
  let state = recordedHabit();
  state = circleModel.updateTask(circleModel.addTask(state, "clear-task").state, "clear-task", "Bring a book");
  const stale = structuredClone(state);
  stale.habits.definitions["history-walk"].updatedAt = "2026-01-01T00:00:00.000Z";
  stale.tasks.items["clear-task"].updatedAt = "2026-01-01T00:00:00.000Z";
  const evidence = structuredClone(state.habits.completions);
  state = circleModel.archiveHabitDefinition(state, "history-walk");
  state = circleModel.archiveTask(state, "clear-task");
  assert.equal(state.habits.definitions["history-walk"].action, "Walk five minutes");
  assert.equal(state.tasks.items["clear-task"].text, "Bring a book");
  assert.deepEqual(state.habits.completions, evidence);
  state = normalizeState(JSON.parse(JSON.stringify(circleModel.mergeServerState(state, stale))));
  assert.equal(state.habits.definitions["history-walk"].status, "archived");
  assert.equal(state.tasks.items["clear-task"].status, "archived");
  assert.deepEqual(state.habits.completions, evidence);
  assert.equal(circleModel.archiveTask(state, "clear-task"), state);
  assert.equal(circleModel.archiveHabitDefinition(state, "missing"), state);
  const completed = circleModel.completeTask(circleModel.addTask(state, "finished-task").state, "finished-task");
  assert.equal(circleModel.archiveTask(completed, "finished-task"), completed);
});

test("Habit history keeps completion wording through rename, archive and reload", () => {
  let state = recordedHabit();
  const snapshot = structuredClone(state.habits.completions["2026-11-01:history-walk"].snapshot);
  assert.deepEqual(snapshot, {
    text: "To become A steady walker, I will Walk five minutes after coffee.",
    action: "Walk five minutes", cue: "after coffee", identity: "A steady walker",
  });
  state = updateHabitDefinitionParts(state, "history-walk", { action: "Read", cue: "at night", identity: "A reader" });
  assert.match(circleModel.dayRecord(state, "2026-11-01").habits[0].text, /Read/,
    "the older day view reads current wording; dated history must not use it");
  state = circleModel.discardEmptyHabit(updateHabitDefinition(state, "history-walk", ""), "history-walk");
  assert.equal(circleModel.dayRecord(state, "2026-11-01").habits.length, 0,
    "the older view hides archived definitions; history retains the completion");
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  const record = circleModel.habitHistoryRecord(state, "2026-11-01");
  assert.equal(record.habits.length, 1);
  assert.equal(record.habits[0].wordingSource, "snapshot");
  assert.equal(record.habits[0].text, snapshot.text);
  assert.deepEqual(record.habits[0].parts, { action: snapshot.action, cue: snapshot.cue, identity: snapshot.identity });
  assert.deepEqual(state.habits.completions["2026-11-01:history-walk"].snapshot, snapshot);
});

test("Habit history preserves snapshots and explicit undo across stale merges", () => {
  const original = recordedHabit();
  const undo = toggleHabitForDay(original, "history-walk", "2026-11-01");
  // Explicit timestamps make the stale-merge ordering deterministic.
  original.habits.completions["2026-11-01:history-walk"].updatedAt = "2026-11-01T10:00:00.000Z";
  undo.habits.completions["2026-11-01:history-walk"].updatedAt = "2026-11-01T11:00:00.000Z";
  const merged = circleModel.mergeServerState(undo, original);
  assert.equal(circleModel.habitHistoryRecord(merged, "2026-11-01").total, 0);
  assert.deepEqual(merged.habits.completions["2026-11-01:history-walk"].snapshot, original.habits.completions["2026-11-01:history-walk"].snapshot);
  const renamed = updateHabitDefinition(original, "history-walk", "Walk ten minutes");
  const result = circleModel.mergeServerState(renamed, original);
  assert.equal(circleModel.habitHistoryRecord(result, "2026-11-01").habits[0].text, original.habits.completions["2026-11-01:history-walk"].snapshot.text);
});

test("legacy Habit completions stay accessible without invented wording", () => {
  let state = recordedHabit();
  delete state.habits.completions["2026-11-01:history-walk"].snapshot;
  state.habits.definitions["history-walk"].status = "archived";
  const before = JSON.stringify(state);
  let row = circleModel.habitHistoryRecord(state, "2026-11-01").habits[0];
  assert.equal(row.wordingSource, "current");
  assert.equal(row.text, state.habits.definitions["history-walk"].text);
  assert.equal(JSON.stringify(state), before, "reading history has no write effects");
  delete state.habits.definitions["history-walk"];
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  row = circleModel.habitHistoryRecord(state, "2026-11-01").habits[0];
  assert.equal(row.wordingSource, "unknown");
  assert.equal(row.text, "Habit");
  assert.equal(state.habits.completions["2026-11-01:history-walk"].snapshot, undefined);
});

test("Habit history dates include old and undone records without duplicates or future dates", () => {
  let state = recordedHabit();
  state = toggleHabitForDay(state, "history-walk", "2026-11-01");
  state = toggleHabitForDay(state, "history-walk", "2026-10-20");
  state = toggleHabitForDay(state, "history-walk", "2026-11-03");
  state.tasks.items.done = { id: "done", text: "One task", status: "completed", createdAt: "2026-10-25T08:00:00Z", completedAt: "2026-10-25T08:00:00Z" };
  assert.deepEqual(circleModel.habitHistoryDates(state, "2026-11-03"), ["2026-11-01", "2026-10-25", "2026-10-20"]);
  assert.equal(circleModel.habitHistoryRecord(state, "2026-10-25").tasks[0].id, "done");
  assert.deepEqual(circleModel.habitHistoryDates(createEmptyState(), "2026-11-03"), []);
});

test("a new completion captures new wording without changing an earlier day", () => {
  let state = recordedHabit();
  const old = structuredClone(state.habits.completions["2026-11-01:history-walk"]);
  state = updateHabitDefinitionParts(state, "history-walk", { action: "Walk ten minutes", cue: "before lunch", identity: "A daily walker" });
  state = toggleHabitForDay(state, "history-walk", "2026-11-02");
  assert.equal(state.habits.completions["2026-11-02:history-walk"].snapshot.action, "Walk ten minutes");
  assert.deepEqual(state.habits.completions["2026-11-01:history-walk"], old);
});

test("saved empty wording and missing definitions never borrow later wording", () => {
  const added = addHabitDefinition(createEmptyState(), "empty-history");
  let state = toggleHabitForDay(added.state, added.id, "2026-11-01");
  state = updateHabitDefinition(state, added.id, "Words added later");
  assert.deepEqual(circleModel.habitHistoryRecord(state, "2026-11-01").habits[0], {
    id: added.id, text: "Habit", wordingSource: "snapshot", parts: { action: "", cue: "", identity: "" },
  });
  state = recordedHabit();
  delete state.habits.definitions["history-walk"];
  assert.match(circleModel.habitHistoryRecord(normalizeState(state), "2026-11-01").habits[0].text, /Walk five minutes/);
});

test("Record fields preserve raw saved parts without parsing legacy sentences or borrowing later words", () => {
  let state = recordedHabit();
  const completion = state.habits.completions["2026-11-01:history-walk"];
  completion.snapshot = { text: "Stored compatibility wording", action: "10 push ups", cue: "evening", identity: "consistency > intensity" };
  state = updateHabitDefinitionParts(state, "history-walk", { action: "A later name", cue: "morning", identity: "A later result" });
  const before = JSON.stringify(state);
  const row = circleModel.habitHistoryRecord(state, "2026-11-01").habits[0];
  assert.deepEqual(row.parts, { action: "10 push ups", cue: "evening", identity: "consistency > intensity" });
  row.parts.action = "Changed returned copy";
  assert.equal(JSON.stringify(state), before, "reading/using the projection does not mutate evidence");
  state.habits.completions["2026-11-01:history-walk"].snapshot = { text: "Unstructured old words" };
  const legacy = circleModel.habitHistoryRecord(state, "2026-11-01").habits[0];
  assert.equal(legacy.parts, null);
  assert.equal(legacy.text, "Unstructured old words");
  state.habits.completions["2026-11-01:history-walk"].snapshot = { text: "", action: "", cue: "", identity: "" };
  assert.deepEqual(circleModel.habitHistoryRecord(state, "2026-11-01").habits[0].parts, { action: "", cue: "", identity: "" });
});

test("an unnamed new habit stays a recoverable draft until its action is committed", () => {
  const added = addHabitDefinition(createEmptyState(), "cue-first", { draft: true });
  const revision = added.state.evidence.localRevision;
  let state = updateHabitDefinitionDraft(added.state, added.id, { cue: "After lunch", identity: "A steady walker" });
  state = circleModel.discardEmptyHabit(state, added.id);
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(state.habits.definitions[added.id].status, "draft");
  assert.equal(state.habits.definitions[added.id].cue, "After lunch");
  assert.equal(state.habits.definitions[added.id].identity, "A steady walker");
  assert.equal(state.evidence.localRevision, revision, "unnamed drafts are not queued as saved habits");
  assert.strictEqual(toggleHabitForDay(state, added.id, "2026-11-03"), state, "a draft cannot be completed");
  state = updateHabitDefinition(state, added.id, "   ");
  assert.equal(state.habits.definitions[added.id].status, "draft");
  assert.equal(state.evidence.localRevision, revision);
  state = updateHabitDefinition(state, added.id, "Walk five minutes");
  assert.equal(state.habits.definitions[added.id].status, "active");
  assert.equal(state.habits.definitions[added.id].cue, "After lunch");
  assert.equal(state.habits.definitions[added.id].identity, "A steady walker");
  assert.equal(state.evidence.localRevision, revision + 1);
});

test("resuming an older empty Habit placeholder preserves its optional fields", () => {
  const added = addHabitDefinition(createEmptyState(), "older-placeholder");
  const state = updateHabitDefinitionDraft(added.state, added.id, { cue: "After coffee", identity: "A reader" });
  const resumed = addHabitDefinition(state, added.id, { draft: true });
  assert.equal(resumed.state.habits.definitions[added.id].status, "draft");
  assert.equal(resumed.state.habits.definitions[added.id].cue, "After coffee");
  assert.equal(resumed.state.habits.definitions[added.id].identity, "A reader");
  assert.equal(resumed.state.evidence.localRevision, state.evidence.localRevision);
  assert.strictEqual(addHabitDefinition(resumed.state, added.id, { draft: true }).state, resumed.state);
});

test("a completed Habit setup replaces the Day One starter Habit", () => {
  const chapter = {
    title: "Build a habit",
    pages: [
      {
        type: "idle",
        body: "I will {{habit-action}} {{habit-time-place}}, so I can become {{habit-identity}}.",
      },
    ],
  };
  const run = {
    runId: "habit-building-run-1",
    status: "completed",
    answers: [
      { answerKey: "habit-action", value: "Walk five minutes", displaySnapshot: "Walk five minutes" },
      { answerKey: "habit-time-place", value: "after coffee", displaySnapshot: "after coffee" },
      { answerKey: "habit-identity", value: "a steady walker", displaySnapshot: "a steady walker" },
    ],
  };
  const starter = addHabitDefinition(createEmptyState(), "day-one-starter");
  const state = updateHabitDefinitionParts(starter.state, starter.id, {
    action: "ONBOARDING ANSWER",
    cue: "ONBOARDING ANSWER",
    identity: "ONBOARDING ANSWER",
    text: "ONBOARDING ANSWER",
  });
  const completed = applyHabitBuildingCompletion(state, chapter, run);
  const habitId = "day-one-starter";
  const habit = completed.habits.definitions[habitId];

  assert.equal(habit.action, "Walk five minutes");
  assert.equal(habit.cue, "after coffee");
  assert.equal(habit.identity, "a steady walker");
  assert.equal(
    habit.text,
    "I will Walk five minutes after coffee, so I can become a steady walker.",
  );
  assert.equal(completed.profile.identityFocus, "a steady walker");
  assert.equal(habit.setupRunId, run.runId);

  const repeated = applyHabitBuildingCompletion(completed, chapter, run);
  assert.deepEqual(Object.keys(repeated.habits.definitions), [habitId]);
  assert.strictEqual(repeated, completed);
});

test("a chapter-shaped habit keeps action, cue and identity separately", () => {
  const added = addHabitDefinition(createEmptyState(), "write");
  const state = updateHabitDefinitionParts(added.state, added.id, {
    action: "Write 1 thing down",
    cue: "after making coffee",
    identity: "Someone who notices my life",
    text: "I will Write 1 thing down, after making coffee, so I can become Someone who notices my life.",
  });

  assert.deepEqual(
    {
      action: state.habits.definitions.write.action,
      cue: state.habits.definitions.write.cue,
      identity: state.habits.definitions.write.identity,
    },
    {
      action: "Write 1 thing down",
      cue: "after making coffee",
      identity: "Someone who notices my life",
    },
  );
  assert.equal(habitRowText(state.habits.definitions.write, false), "Write 1 thing down after making coffee");
  assert.equal(habitRowText(state.habits.definitions.write, true), "Someone who notices my life");
});

test("two habits keep their own identity through tick, untick and tick", () => {
  let state = createEmptyState();
  for (const [id, identity] of [["write", "A writer"], ["walk", "Someone who cares for my body"]]) {
    const added = addHabitDefinition(state, id);
    state = updateHabitDefinitionParts(added.state, id, { action: id, identity });
  }
  const day = "2026-08-14";
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, true), "A writer");
  assert.equal(state.habits.definitions.walk.identity, "Someone who cares for my body");
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, false), "write");
  state = toggleHabitForDay(state, "write", day);
  assert.equal(habitRowText(state.habits.definitions.write, true), "A writer");
});

test("a legacy text-only habit migrates to action and still ticks", () => {
  const legacy = createEmptyState();
  legacy.habits.definitions.walk = {
    id: "walk",
    text: "Walk after lunch",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
  let state = normalizeState(legacy);
  assert.deepEqual(
    {
      action: state.habits.definitions.walk.action,
      cue: state.habits.definitions.walk.cue,
      identity: state.habits.definitions.walk.identity,
    },
    { action: "Walk after lunch", cue: "", identity: "" },
  );
  state = toggleHabitForDay(state, "walk", "2026-08-14");
  assert.equal(state.habits.completions["2026-08-14:walk"].completed, true);
  assert.equal(habitRowText(state.habits.definitions.walk, true), "Walk after lunch");
});

test("editing action preserves cue and identity, while identityFocus still personalises Thoughts", () => {
  const added = addHabitDefinition(createEmptyState(), "morning");
  let state = updateHabitDefinitionParts(added.state, added.id, {
    action: "Read",
    cue: "after breakfast",
    identity: "A reader",
  });
  state = updateHabitDefinition(state, added.id, "Read two pages");
  assert.equal(state.habits.definitions.morning.cue, "after breakfast");
  assert.equal(state.habits.definitions.morning.identity, "A reader");

  state.profile.identityFocus = "A calm builder";
  const prompts = Array.from({ length: 24 }, (_, hour) =>
    selectThoughtPrompt(state, "2026-08-12", new Date(2026, 7, 12, hour)),
  );
  assert.ok(prompts.some((prompt) => prompt.includes("calm builder")));
});

test("habit typing keeps spaces verbatim until blur commits the value", () => {
  const added = addHabitDefinition(createEmptyState(), "spaced");
  const revision = added.state.evidence.localRevision;
  let state = updateHabitDefinitionDraft(added.state, added.id, {
    action: "a b c ",
  });

  assert.equal(state.habits.definitions.spaced.action, "a b c ");
  assert.equal(state.evidence.localRevision, revision, "a draft is not synced mid-keystroke");

  state = updateHabitDefinition(
    state,
    added.id,
    state.habits.definitions.spaced.action,
  );
  assert.equal(state.habits.definitions.spaced.action, "a b c");
  assert.equal(normalizeState(state).habits.definitions.spaced.action, "a b c");
  assert.equal(state.evidence.localRevision, revision + 1);
});

test("legacy Habit setup preserves answers through reload and creates its habit only once completed", () => {
  const at = "2026-11-01T08:00:00.000Z";
  const values = [
    ["habit-action", "Walk five minutes"],
    ["habit-time-place", "after coffee"],
    ["habit-identity", "a steady walker"],
  ];
  const chapter = {
    id: "habit-building", version: 1, session: "habit", title: "Build a habit",
    pages: [
      ...values.map(([answerKey]) => ({ id: answerKey, type: "short-text", answerKey })),
      { id: "result", type: "result" },
      { id: "habit", type: "idle", body: "I will {{habit-action}} {{habit-time-place}}, so I can become {{habit-identity}}." },
    ],
  };
  const run = createChapterRun(chapter, values.map(([answerKey, value]) => ({
    pageId: answerKey, answerKey, value, displaySnapshot: value, answeredAt: at, changedAt: at,
  })));
  const state = storeChapterRun(createEmptyState(), run, "habit");
  assert.strictEqual(applyHabitBuildingCompletion(state, chapter, run), state);
  assert.deepEqual(state.habits.definitions, {}, "unfinished answers do not create a habit");

  const completedRun = { ...run, status: "completed", currentPageId: "habit", furthestPageId: "habit", completedAt: at };
  const completed = applyHabitBuildingCompletion(storeChapterRun(state, completedRun, "habit"), chapter, completedRun);
  const reloaded = normalizeState(JSON.parse(JSON.stringify(completed)));
  const habits = Object.values(reloaded.habits.definitions);
  assert.equal(habits.length, 1);
  assert.deepEqual([habits[0].action, habits[0].cue, habits[0].identity], values.map(([, value]) => value));
  assert.equal(habits[0].text, "I will Walk five minutes after coffee, so I can become a steady walker.");
  assert.equal(habits[0].setupRunId, run.runId);
  assert.deepEqual(reloaded.chapters.runs[run.runId], completedRun, "the original version and answers survive reload");
  assert.strictEqual(applyHabitBuildingCompletion(reloaded, chapter, reloaded.chapters.runs[run.runId]), reloaded);
});

test("one gap separates Habits from Tasks, declared once", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  // 16px of grid gap plus a 25px margin added up to 41px while claiming 25.
  // Sai: "do 25 px between habits and tasks, the gap feels wide."
  assert.match(css, /\.circle-os \.os-routine-body \{[^}]*gap: var\(--os-main-sub-gap\)/);
  assert.doesNotMatch(
    css,
    /\.circle-os \.os-task-body-session \{[^}]*margin-top/,
    "Tasks must not add a margin on top of the routine body's gap",
  );
});
