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
test("the App Box is the Page's own height, measured by nothing", () => {
  const session = readFileSync("app/os/app-session.tsx", "utf8");
  // No measurement, so there is no moment when the box knows the wrong height.
  // Every version of this ended the same way: the box stood at the outgoing
  // Page's height and then corrected, and the correction was what he saw.
  assert.doesNotMatch(session, /contentHeight/);
  assert.doesNotMatch(session, /commitMeasurement/);
  assert.match(session, /style=\{frameHeight \? \{ height: frameHeight \} : undefined\}/);

  // Nor an ease into place: a Page arriving is not a box growing.
  const css = readFileSync("app/os/os-app.css", "utf8");
  assert.doesNotMatch(css, /page-resizing/);
  assert.doesNotMatch(session, /frameEasing/);
  // The current Page stays in flow, which is what makes the box its height.
  const adjacent = css.slice(
    css.indexOf(".circle-os .os-app-page.adjacent {"),
    css.indexOf(".circle-os .os-app-page.adjacent.previous"),
  );
  assert.match(adjacent, /position: absolute/);
  // And a Page waiting at either side keeps its own height rather than being
  // stretched to the box. Stretched, it was laid out at the height of the Page
  // being left for the whole swipe and laid out again on landing, which is the
  // jolt itself — in every App with more than one Page.
  assert.match(adjacent, /bottom: auto/);
  assert.doesNotMatch(adjacent, /inset: 0/);
  // And the floor still holds: an App Box is never shorter than the standard.
  assert.match(
    css,
    /os-app-window\.fluid-height \{\s+min-height: var\(--os-app-box-min-height\)/,
  );
});

// Sai: "make it directly editable in the week app rather than directing to
// routine app." Routine has a row for the same task, addressed by the task's id
// and standing earlier in the page, so the cursor was landing over there.
test("a step is written where it was added", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /function weekStepEditorId\(taskId: string\) \{\s+return `week-step-\$\{taskId\}`;/);
  assert.match(shell, /data-inline-editor-id=\{weekStepEditorId\(step\.taskId\)\}/);
  assert.match(shell, /setNewGoalEditorId\(weekStepEditorId\(editorId\)\)/);
  // Routine's own row keeps the plain task id, so the two never collide.
  assert.match(shell, /data-inline-editor-id=\{task\.id\}/);
});

// Sai: "Make the week app dark circle buttons to have orange stroke. And the
// correspondent task in routine app would also use the same dark orange button.
// So that we understand its from week app."
test("a step wears the same key in both Apps", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // The Week's own rows.
  assert.match(shell, /className="os-row-tick os-row-tick-habit os-row-tick-week"/);
  assert.match(shell, /className="os-row-tick os-row-tick-task os-row-tick-week"/);
  // And Routine's row for a task that is a step.
  assert.match(
    shell,
    /goalStepForTask\(state, task\.id\) \? " os-row-tick-week" : ""/,
  );
  assert.match(shell, /goalStepForTask\(state, task\.id\) \? " from-week" : ""/);

  const css = readFileSync("app/os/os-app.css", "utf8");
  const key = css.slice(
    css.indexOf(".circle-os .os-creative-button-shell.role-habit .os-row-tick-week"),
    css.indexOf(".circle-os .os-task-row.from-week"),
  );
  assert.match(key, /border-color: var\(--c-orange\)/);
  assert.match(key, /--os-key-leg-orange: var\(--c-ink-deep\)/);
});

// The other half of the jolt. The App Box knew its height a frame late; the
// text inside it was placed a frame late too, so the heading moved under the
// forehead after the Page had landed. Sai: "The forehead jolt issue is still
// there for log app."
test("a Page's text is placed before the Page is painted", () => {
  const session = readFileSync("app/os/app-session.tsx", "utf8");
  const effect = session.slice(
    session.indexOf("const commit = () => {"),
    session.indexOf("window.addEventListener(\"resize\", measure)"),
  );
  // The work is a plain call, and the frame is kept only for what arrives late.
  assert.doesNotMatch(effect, /requestAnimationFrame\(\(\) =>/);
  assert.match(session, /commit\(\);\n\s*void document\.fonts\.ready\.then\(measure\)/);
  assert.match(session, /frame = window\.requestAnimationFrame\(commit\)/);

  // And the Week Page is measured at all: its Main text is the day's name,
  // written in place, so an input has to count as Main text.
  assert.match(session, /"textarea, input, h1, h2, h3, p, \[data-os-main-text\]"/);
});

// Sai: "Make a border, like a card for each goal and respective steps."
test("a goal and its steps are one card", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  const card = css.slice(
    css.indexOf(".circle-os .os-week-goal {"),
    css.indexOf(".circle-os .os-week-goal-head"),
  );
  assert.match(card, /border: 1px solid/);
  assert.match(card, /border-radius: var\(--r-lg\)/);
  assert.match(card, /padding:/);

  // The card holds the goal, its steps and its own way to add one; adding a
  // goal stands outside it.
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const goals = shell.slice(
    shell.indexOf('<div className="os-week-goals">'),
    shell.indexOf("os-week-day-summary"),
  );
  const article = goals.indexOf('className="os-week-goal"');
  const addStep = goals.indexOf("os-week-add-step");
  const closeArticle = goals.indexOf("</article>");
  const addGoal = goals.indexOf("os-week-add-goal");
  assert.ok(article < addStep && addStep < closeArticle, "a step is added inside");
  assert.ok(closeArticle < addGoal, "a goal is added outside");
});

// Sai: "The dark button for steps on routine task, should be darker, and the
// orange ring blended with the background orange ... be bold in routine app
// over all look, to indicate priority."
test("a step reads as the priority among Routine's tasks", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  const key = css.slice(
    css.indexOf(".circle-os .os-task-row.from-week .os-row-tick-week"),
    css.indexOf(".circle-os .os-task-row.from-week .os-row-tick-week")
      + 240,
  );
  assert.match(key, /background: var\(--c-ink\)/, "darker than on the Week Page");
  // The ring is the brand orange. A paler mix read more strongly against the
  // card but was not the colour: Sai, on trying it, "that white ring sucks."
  assert.match(key, /border-color: var\(--c-orange\)/);

  const row = css.slice(
    css.indexOf(".circle-os .os-task-row.from-week .os-extra-mission-copy"),
    css.indexOf(".circle-os .os-habit-body-session .os-extra-mission-copy::placeholder"),
  );
  assert.match(row, /font-weight: 700/);
  assert.match(row, /color: var\(--c-ink\)/);
});

// Sai: "between the 'Day' and 'week nav bar', add the date, ('August 31') for
// each day of the week." A day he has renamed still has to say which day it is.
test("a day says its date under whatever he calls it", () => {
  const [monday] = weekDays(createEmptyState(), WEDNESDAY);
  assert.equal(monday.date, "August 24");
  assert.equal(weekDays(createEmptyState(), "2026-09-01")[0].date, "August 31");

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const page = shell.slice(
    shell.indexOf("os-week-day-name"),
    shell.indexOf("os-week-goals"),
  );
  const name = page.indexOf("os-week-day-name");
  const date = page.indexOf("os-week-date");
  const strip = page.indexOf("os-week-strip");
  assert.ok(name < date && date < strip, "name, then date, then the week");
  assert.match(page, /\{logChosenDay\.date\}/);
});

// A step under a goal he has called done is carried by the goal.
test("Routine stops asking for a step whose goal is done", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(
    shell,
    /\.filter\(\(task\) => !taskIsUnderDoneGoal\(state, task\.id\)\)/,
  );
});

// Sai: "All the app box expend animation is not smooth anymore. Fix the expend
// animation for all so that it smoothly expend and with ease."
test("the box's edge moves, and everything inside it stays put", () => {
  const session = readFileSync("app/os/app-session.tsx", "utf8");
  const play = session.slice(
    session.indexOf("const playGrowth = useCallback("),
    session.indexOf("useLayoutEffect", session.indexOf("const playGrowth")),
  );
  // Animated after the layout is final, so nothing is laid out at an interim
  // size — that is what made the old measured height jolt.
  assert.match(play, /frame\.animate\(/);
  assert.match(play, /duration: GROWTH_MS, easing: GROWTH_EASE/);
  assert.match(session, /const GROWTH_EASE = "cubic-bezier\(0\.22, 0\.72, 0\.22, 1\)"/);
  // A textarea following the caret is not an expansion.
  assert.match(play, /Math\.abs\(nextHeight - from\) <= GROWTH_MIN_PX\) return;/);

  // Both places a height can change drive it, through one record of where the
  // edge was: the Page arrived at, and the Page in front of you growing.
  assert.match(session, /const boxHeight = useRef<number \| null>\(null\)/);
  assert.match(
    session,
    /previousActiveIndex\.current = activeIndex;[\s\S]*?playGrowth\(windowRef\.current\.getBoundingClientRect\(\)\.height\)/,
  );
  assert.match(
    session,
    /new ResizeObserver\(\(\) => \{\s+if \(dragging \|\| settling\) return;\s+playGrowth\(/,
  );
});

// Sai, on Typical Tuesday: "it expend and scroll my screen to the end of the
// expension."
test("opening something in view does not scroll the screen", () => {
  const anchor = readFileSync("app/os/stable-route-anchor.ts", "utf8");
  // The anchor protects a reader from a change above the fold. A box he can see
  // is a box he opened, and holding something below it still would scroll his
  // view to the end of what just opened.
  assert.match(anchor, /if \(changingRect\.top >= 0\) \{/);
  const guard = anchor.indexOf("if (changingRect.top >= 0)");
  const scroll = anchor.indexOf("window.scrollBy");
  assert.ok(guard > 0 && guard < scroll, "the guard stands before the scroll");
});
