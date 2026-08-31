import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createEmptyState } from "../app/os/circle-os-model.js";
import {
  WEEK_DAY_LETTERS,
  weekCoverLine,
  weekDays,
  weekSpan,
  weekStartKey,
  weekTotals,
} from "../app/os/week-app-model.js";

// 2026-08-26 is a Wednesday.
const WEDNESDAY = "2026-08-26";

function stateWith(days = {}, habits = []) {
  const state = createEmptyState();
  for (const [index, action] of habits.entries()) {
    state.habits.definitions[`h${index}`] = {
      id: `h${index}`,
      text: action,
      status: "active",
      createdAt: `2026-08-0${index + 1}T00:00:00.000Z`,
    };
  }
  for (const [dateKey, day] of Object.entries(days)) {
    state.days[dateKey] = { ...state.days[dateKey], date: dateKey, ...day };
    for (const habitId of day.kept || []) {
      state.habits.completions[`${dateKey}:${habitId}`] = { completed: true };
    }
  }
  return state;
}

test("the week runs Monday to Sunday around whatever day it is", () => {
  assert.equal(weekStartKey(WEDNESDAY), "2026-08-24");
  const days = weekDays(createEmptyState(), WEDNESDAY);
  assert.equal(days.length, 7);
  assert.equal(days[0].dateKey, "2026-08-24");
  assert.equal(days[6].dateKey, "2026-08-30");
  assert.deepEqual(days.map((day) => day.letter), [...WEEK_DAY_LETTERS]);
  // A Monday belongs to its own week, not the one before it.
  assert.equal(weekStartKey("2026-08-24"), "2026-08-24");
  assert.equal(weekStartKey("2026-08-30"), "2026-08-24");
});

test("today and the days not yet lived are marked, not counted", () => {
  const days = weekDays(createEmptyState(), WEDNESDAY);
  const today = days.find((day) => day.isToday);
  assert.equal(today?.dateKey, WEDNESDAY);
  assert.deepEqual(
    days.filter((day) => day.isFuture).map((day) => day.dateKey),
    ["2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30"],
  );
  // A Thursday that has not happened is not a Thursday that was missed.
  assert.equal(weekTotals(createEmptyState(), WEDNESDAY).days, 3);
});

test("a day counts only what the person actually put in it", () => {
  const state = stateWith(
    {
      "2026-08-24": { kept: ["h0"], timeBlocks: [{ start: "09:00" }] },
      "2026-08-25": { title: "Long one" },
    },
    ["Walk", "Read"],
  );
  const days = weekDays(state, WEDNESDAY);
  const [monday, tuesday, wednesday] = days;

  assert.equal(monday.kept, 1);
  assert.equal(monday.due, 2);
  assert.equal(monday.hours, 1);
  assert.equal(monday.touched, true);

  // A title alone is still something written down.
  assert.equal(tuesday.title, "Long one");
  assert.equal(tuesday.touched, true);
  assert.equal(tuesday.kept, 0);

  // An untouched day says so rather than being filled in.
  assert.equal(wednesday.touched, false);
  assert.equal(wednesday.hours, 0);

  const totals = weekTotals(state, WEDNESDAY);
  assert.equal(totals.touched, 2);
  assert.equal(totals.kept, 1);
  assert.equal(totals.hours, 1);
});

// The span straddles the week boundary on purpose: the point is the days close
// enough to still act on, which does not reset on a Monday.
test("the span reaches either side of today, across the week edge", () => {
  const span = weekSpan(createEmptyState(), "2026-08-24", 3, 3);
  assert.equal(span.length, 7);
  assert.equal(span[0].dateKey, "2026-08-21");
  assert.equal(span[3].dateKey, "2026-08-24");
  assert.equal(span[3].isToday, true);
  assert.equal(span[6].dateKey, "2026-08-27");
  // Reaching back over a month boundary still lands on real days.
  assert.equal(weekSpan(createEmptyState(), "2026-09-01", 2, 0)[0].dateKey, "2026-08-30");
});

// The cover changes as the week is lived, and never praises or consoles.
test("the cover says where the week is", () => {
  const empty = createEmptyState();
  assert.equal(weekCoverLine(empty, "2026-08-24"), "Nothing written down yet.");

  const partial = stateWith({ "2026-08-24": { title: "One" } }, []);
  assert.equal(weekCoverLine(partial, "2026-08-25"), "1 of 2 days written down.");

  const full = stateWith(
    { "2026-08-24": { title: "One" }, "2026-08-25": { title: "Two" } },
    [],
  );
  assert.equal(weekCoverLine(full, "2026-08-25"), "2 days, all in.");
  assert.equal(weekCoverLine(full, "2026-08-24"), "Today is in.");
});

// The Week Page is where the week is planned: what a day is for, and the
// smallest step toward it. Sai: "below navigation bar, i want to make it for
// the goal of the day ... below that will be the sub task."
test("a day's goals sit under the day strip, each with its steps", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const page = shell.slice(
    shell.indexOf("os-week-day-name"),
    shell.indexOf("os-week-day-summary"),
  );
  const strip = page.indexOf("os-week-strip");
  const goals = page.indexOf("os-week-goals");
  const goal = page.indexOf("os-week-goal-head");
  const step = page.indexOf("os-week-step");
  assert.ok(strip > 0 && goals > strip, "the goals follow the day strip");
  assert.ok(step > goal, "a step is written under the goal it serves");

  // Both tick, and both latch: a tick is a state you leave the key in.
  assert.match(page, /toggleGoal\(current, goal\.id\)[\s\S]*?release="latch"\n\s*role="habit"/);
  assert.match(page, /finishTask\(step\.taskId\)[\s\S]*?release="latch"\n\s*role="habit"/);
  // Only the step is the Routine task. The goal is ticked here and nowhere else.
  assert.match(page, /finishTask\(step\.taskId/);
  assert.match(page, /updateTask\(current, step\.taskId/);
  assert.doesNotMatch(page, /finishTask\(goal\./);
});

// Sai: "Monday, Tuesday, ... make those editable. I could say, Jame's birthday.
// ... and that would be shown in Log app, current 'Beautiful Day' placeholder."
test("the day's name is written here and read in the Log", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // One field, one record: the Week Page writes the same day title the Log
  // shows, so naming a day here names it there.
  assert.match(shell, /className="os-app-page-heading os-week-day-name"/);
  assert.match(shell, /setDayTitle\(day, value\)/);
  assert.match(shell, /placeholder=\{logChosenDay\.name\}/);
});

// Sai: "Log app, it readjust upon viewing from the swipe, so it feels like
// jolting every swipe." The height of the Page you land on has to be known
// before the browser paints it, not two frames later.
test("the App Box knows the arriving Page's height before it is painted", () => {
  const session = readFileSync("app/os/app-session.tsx", "utf8");
  const measured = session.slice(
    session.indexOf("const commitMeasurement"),
    session.indexOf("void document.fonts.ready"),
  );
  const defined = measured.indexOf("const measure =");
  const committed = measured.indexOf("\n    commitMeasurement();");
  assert.ok(committed > defined, "the commit is synchronous, ahead of the settle");

  // And the resize is the Page's own arrival, so the two finish together.
  const css = readFileSync("app/os/os-app.css", "utf8");
  const arrival = css.match(/os-page-arrive-next (\d+)ms (cubic-bezier\([^)]+\))/);
  const resize = css.match(/page-resizing \{\n\s*transition: height (\d+)ms (cubic-bezier\([^)]+\))/);
  assert.ok(arrival && resize);
  assert.equal(resize[1], arrival[1]);
  assert.equal(resize[2], arrival[2]);
});
