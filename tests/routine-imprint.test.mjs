import assert from "node:assert/strict";
import test from "node:test";
import { toggleHabitForDay, completeTask, reopenTask, createEmptyState, getDateKey, normalizeState } from "../app/os/circle-os-model.js";
import { projectLocalImprint } from "../app/os/home/imprint-local-activity.ts";

test("Routine preserves the first day's Imprint age through Undo, reload and re-check", () => {
  const localDate = new Date(2026, 10, 21, 5, 59);
  assert.equal(getDateKey(localDate), "2026-11-20");
  localDate.setMinutes(60);
  assert.equal(getDateKey(localDate), "2026-11-21");
  const day = "2026-11-21";
  let state = createEmptyState();
  for (const id of ["old", "walk", "read"]) {
    state.habits.definitions[id] = { id, text: id, action: id, status: "active" };
  }
  const project = () => projectLocalImprint(state.habits.completions);
  state = toggleHabitForDay(state, "old", day);
  assert.deepEqual(project(), []);
  const tick = (habit, hour) => {
    state = toggleHabitForDay(state, habit, day, {
      id: `${habit}-${hour}`, at: `2026-11-21T${hour}:00:00Z`, timeZone: "Asia/Bangkok",
    });
  };
  tick("walk", "01");
  const [first] = project();
  assert.equal(first.at, "2026-11-21T01:00:00Z");
  assert.equal(first.fadeAt, Date.parse("2026-11-23T06:00:00+07:00"));
  tick("read", "02");
  tick("walk", "03");
  assert.equal(state.habits.completions[`${day}:walk`].completedAt, null);
  assert.deepEqual(project(), [{ ...first, sources: [`habit:${day}:read`] }]);
  tick("read", "04");
  assert.deepEqual(project(), []);
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  tick("walk", "05");
  assert.deepEqual(project(), [first]);
  assert.equal(state.habits.completions[`${day}:walk`].completedAt, "2026-11-21T05:00:00Z");
  state.habits.definitions.walk.status = "archived";
  assert.deepEqual(project(), [first]);
});

test("a task uses the checked view and keeps each patch's original age after Undo", () => {
  const day = "2026-11-21";
  let state = createEmptyState();
  state.tasks.items.shared = { id: "shared", text: "Read a page", status: "open" };
  const action = (hour, origin) => ({
    id: `operation-${hour}`, at: `2026-11-21T${hour}:00:00Z`, timeZone: "Asia/Bangkok", origin,
  });
  const project = () => projectLocalImprint(state.habits.completions, state.tasks);
  state = completeTask(state, "shared", day, action("01", "routine"));
  const [first] = project();
  assert.equal(first.group, "routine");
  assert.strictEqual(completeTask(state, "shared", day, action("02", "week")), state);
  state = reopenTask(state, "shared", day, action("03", "week"));
  assert.deepEqual(project(), []);
  state = completeTask(state, "shared", day, action("04", "week"));
  assert.deepEqual(project().map(({ group }) => group), ["log-week"]);
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  state = reopenTask(state, "shared", day, action("05", "routine"));
  assert.deepEqual(project(), []);
  state = completeTask(state, "shared", day, action("06", "routine"));
  assert.deepEqual(project(), [first]);
  state.tasks.items.repeat = { id: "repeat", text: "Stretch", status: "open", schedule: { mode: "ongoing", start: day } };
  state = completeTask(state, "repeat", day, action("07", "routine"));
  assert.equal(project()[0].sources.length, 2);
  state = reopenTask(state, "repeat", day, action("08", "week"));
  assert.deepEqual(project(), [first]);
});
