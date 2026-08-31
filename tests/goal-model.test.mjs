import assert from "node:assert/strict";
import test from "node:test";

import {
  addTask,
  completeTask,
  createEmptyState,
  normalizeState,
  updateTask,
} from "../app/os/circle-os-model.js";
import {
  addGoal,
  addGoalStep,
  goalStepForTask,
  goalsForDay,
  mergeGoals,
  removeGoal,
  toggleGoal,
  updateGoal,
} from "../app/os/goal-model.js";

const MONDAY = "2026-08-31";

function goalWithStep(text = "Create a good content", step = "Write down 1 word") {
  let state = createEmptyState();
  const added = addGoal(state, MONDAY, "g1", "2026-08-31T09:00:00.000Z");
  state = updateGoal(added.state, "g1", text);
  const stepped = addGoalStep(state, "g1", addTask, "s1", "2026-08-31T09:01:00.000Z");
  state = updateTask(stepped.state, stepped.taskId, step);
  return { state, taskId: stepped.taskId };
}

test("a goal belongs to a day and is written after it is added", () => {
  let state = createEmptyState();
  state = addGoal(state, MONDAY, "g1").state;
  assert.equal(goalsForDay(state, MONDAY).length, 1);
  assert.equal(goalsForDay(state, MONDAY)[0].text, "", "a goal arrives unwritten");
  assert.equal(goalsForDay(state, "2026-09-01").length, 0, "it belongs to one day");

  state = updateGoal(state, "g1", "Create a good content");
  assert.equal(goalsForDay(state, MONDAY)[0].text, "Create a good content");

  // Days can hold more than one.
  state = addGoal(state, MONDAY, "g2").state;
  assert.equal(goalsForDay(state, MONDAY).length, 2);
});

// A step *is* a Routine task. There is no copy and nothing to sync, so the two
// surfaces cannot drift apart or disagree about what happened.
test("a step is the Routine task, not a copy of one", () => {
  const { state, taskId } = goalWithStep();
  const [goal] = goalsForDay(state, MONDAY);

  assert.equal(goal.steps.length, 1);
  assert.equal(goal.steps[0].text, "Write down 1 word");
  assert.equal(goal.steps[0].taskId, taskId);
  // The very same record is in Routine.
  assert.equal(state.tasks.items[taskId].text, "Write down 1 word");
  assert.equal(goalStepForTask(state, taskId)?.goalId, "g1");
  assert.equal(goalStepForTask(state, "not-a-task"), null);
});

test("ticking the task in Routine ticks the step under the goal", () => {
  const { state, taskId } = goalWithStep();
  assert.equal(goalsForDay(state, MONDAY)[0].steps[0].done, false);

  const done = completeTask(state, taskId);
  assert.equal(goalsForDay(done, MONDAY)[0].steps[0].done, true);
  // And the goal itself is untouched: finishing the step is not finishing it.
  assert.equal(goalsForDay(done, MONDAY)[0].done, false);
});

// "the actual goal completion will have to tick in week app."
test("a goal is ticked on its own, and can be given back", () => {
  let { state } = goalWithStep();
  state = toggleGoal(state, "g1", "2026-08-31T10:00:00.000Z");
  assert.equal(goalsForDay(state, MONDAY)[0].done, true);
  assert.equal(goalsForDay(state, MONDAY)[0].completedAt, "2026-08-31T10:00:00.000Z");

  // Marked done by accident has to be undoable.
  state = toggleGoal(state, "g1");
  assert.equal(goalsForDay(state, MONDAY)[0].done, false);
  assert.equal(goalsForDay(state, MONDAY)[0].completedAt, null);
});

test("a goal that goes takes its steps with it, and its task survives", () => {
  const { state, taskId } = goalWithStep();
  const without = removeGoal(state, "g1");
  assert.equal(goalsForDay(without, MONDAY).length, 0);
  assert.equal(Object.keys(without.goals.steps).length, 0);
  // The task is a Routine record in its own right and is not deleted underneath
  // him — removing a plan must not remove work he may have already done.
  assert.ok(without.tasks.items[taskId]);
});

test("debris never reaches the record, and a goal survives a reload", () => {
  const { state } = goalWithStep();
  assert.deepEqual(goalsForDay(normalizeState(state), MONDAY)[0].steps.length, 1);
  assert.deepEqual(normalizeState(createEmptyState()).goals, { items: {}, steps: {} });

  // A step with no goal, or a goal with no day, is not a record.
  const junk = normalizeState({
    ...createEmptyState(),
    goals: {
      items: { good: { dateKey: MONDAY }, bad: {} },
      steps: { orphan: { goalId: "gone", taskId: "t" }, noTask: { goalId: "good" } },
    },
  });
  assert.deepEqual(Object.keys(junk.goals.items), ["good"]);
  assert.deepEqual(Object.keys(junk.goals.steps), []);
});

test("two devices keep both goals, and the later edit wins a clash", () => {
  const phone = {
    items: { g1: { id: "g1", dateKey: MONDAY, text: "Old", status: "open", updatedAt: "2026-08-31T09:00:00.000Z" } },
    steps: {},
  };
  const laptop = {
    items: {
      g1: { id: "g1", dateKey: MONDAY, text: "New", status: "done", updatedAt: "2026-08-31T11:00:00.000Z" },
      g2: { id: "g2", dateKey: MONDAY, text: "Second", status: "open", updatedAt: "2026-08-31T10:00:00.000Z" },
    },
    steps: {},
  };
  const merged = mergeGoals(phone, laptop);
  assert.equal(merged.items.g1.text, "New");
  assert.equal(merged.items.g2.text, "Second");
  // The older edit does not win by arriving second.
  assert.equal(mergeGoals(laptop, phone).items.g1.text, "New");
});
