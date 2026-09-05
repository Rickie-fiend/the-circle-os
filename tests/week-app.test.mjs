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

// A goal for the week is a wish until it is distilled into days. Sai: "Goal of
// the week distill down in to days, that we can plan ... Then we dont need a
// goal for each day."
test("the week's goals lead the Page, and each day is planned under them", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const page = shell.slice(
    shell.indexOf('className="os-log-page os-log-week"'),
    shell.indexOf("os-week-day-summary"),
  );
  const goals = page.indexOf("os-page-main os-week-goals");
  const dayName = page.indexOf("os-week-day-name");
  const strip = page.indexOf("os-week-strip");
  const plan = page.indexOf("os-week-day-plan");
  // The goals are the Page; the day being planned sits under them. Sai: "it
  // should be the main screen for the week goals. Just like habit in routine."
  assert.ok(goals > 0 && goals < dayName, "the goals lead");
  assert.ok(dayName < strip && strip < plan, "then the day, then its plan");

  // Several goals to a week, ticked in that list and nowhere else.
  assert.match(page, /chosenWeekGoals\.map/);
  assert.match(shell, /const chosenWeekGoals = weekGoals\(state, logWeekKey\)/);
  assert.doesNotMatch(shell, /chosenDayGoals/);
  assert.match(page, /toggleGoal\(current, goal\.id\)[\s\S]*?release="latch"/);

  // Opening a goal is in the header, where Routine puts New habit.
  assert.match(page, /headerRight=\{[\s\S]*?addGoalToWeek\(logWeekKey\)/);

  // One box per goal under the day, holding only that day's steps — writing a
  // step under one is how it gets assigned to that goal.
  assert.match(page, /os-week-goal-day/);
  assert.match(page, /step\.dateKey === logChosenDayKey/);
  assert.match(page, /addStepToGoal\(goal\.id, logChosenDayKey\)/);
  assert.match(page, /updateTask\(current, step\.taskId/);
  assert.doesNotMatch(page, /finishTask\(goal\./);
});

// Sai: "So the task in routine app will be act as a daily task for that day."
test("Routine shows the steps standing on today, and nobody else's", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(
    shell,
    /const step = goalStepForTask\(state, task\.id\);\s+if \(!step\) return true;\s+return !step\.dateKey \|\| step\.dateKey === dateKey;/,
  );
});

// Sai: "Monday, Tuesday, ... make those editable. I could say, Jame's birthday.
// ... and that would be shown in Log app, current 'Beautiful Day' placeholder."
test("the day's name is written here and read in the Log", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // One field, one record: the Week Page writes the same day title the Log
  // shows, so naming a day here names it there.
  assert.match(shell, /className="os-week-day-name"/);
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
test("each goal gets its own box under the day being planned", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  const plan = css.slice(
    css.indexOf(".circle-os .os-week-day-plan {"),
    css.indexOf(".circle-os .os-week-goal-day .os-record-label"),
  );
  assert.match(plan, /os-week-goal-day/);
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // The box names its goal but does not tick it: finishing a goal belongs to
  // the list above, and one tick to a goal is the whole point.
  const box = shell.slice(
    shell.indexOf('<section className="os-week-goal-day"'),
    shell.indexOf("os-week-day-summary"),
  );
  assert.match(box, /os-week-goal-day-name/);
  assert.doesNotMatch(box, /toggleGoal/);
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
    shell.indexOf("os-week-day-plan"),
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
    /previousActiveIndex\.current = activeIndex;[\s\S]*?playGrowth\(currentPageRef\.current\.getBoundingClientRect\(\)\.height\)/,
  );
  assert.match(
    session,
    /new ResizeObserver\(\(\) => \{\s+if \(dragging \|\| settling\) return;\s+playGrowth\(page\.getBoundingClientRect\(\)\.height\)/,
  );

  // The Page is watched, never the frame. Watching the frame is watching the
  // thing being animated: every frame of the animation resizes it, which
  // delivers another observation, which starts another animation from wherever
  // the last one had got to. Sai: "jittery and not usable."
  assert.match(session, /observer\.observe\(page\)/);
  assert.doesNotMatch(session, /observer\.observe\(frame\)/);
  // And the Page is what both callers measure, for the same reason: a frame
  // mid-animation hands back where the animation had reached, not where it is
  // going.
  assert.doesNotMatch(session, /playGrowth\(windowRef\.current/);
  assert.match(session, /playGrowth\(currentPageRef\.current\.getBoundingClientRect\(\)\.height\)/);
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

// Sai: "Log day should be the day of from the week, monday tuesday, market day,
// exam day etc." An unnamed day is still a day of the week, so the placeholder
// is the weekday itself rather than a compliment about it.
test("the Log calls a day by its weekday until it is named", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const logTodayName =\s+logWeekDays\.find\(\(day\) => day\.isToday\)\?\.name \|\| "Today";/);
  assert.match(shell, /placeholder=\{logTodayName\}/);
  assert.doesNotMatch(shell, /placeholder="Beautiful day"/);
  // The Week Page names days the same way, and both write the same field.
  assert.match(shell, /placeholder=\{logChosenDay\.name\}/);
});

// Sai: "how do we mark as complete?" — it could not be, which was a hole.
test("a week's goal is ticked in the list that leads the Page", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const list = shell.slice(
    shell.indexOf('className="os-page-main os-week-goals"'),
    shell.indexOf("os-week-day-body"),
  );
  assert.match(list, /toggleGoal\(current, goal\.id\)/);
  assert.match(list, /release="latch"/, "a tick is a state you leave the key in");
  // Nothing to finish until something is written.
  assert.match(list, /disabled=\{!goal\.text\.trim\(\)\}/);
  // Done reads by receding rather than changing colour.
  assert.match(list, /goal\.done \? " is-done" : ""/);
  // And an empty week says what the space is for.
  assert.match(list, /os-week-goal-empty/);
});

// Sai: "the main goal title and steps be different and clear enough to see as
// title and step. Currently it look the same size same stsrting position."
test("inside a day, a goal reads as a heading and a step as a line", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  const name = css.slice(
    css.indexOf(".circle-os .os-week-goal-day-name {"),
    css.indexOf(".circle-os .os-week-goal-day .os-week-step {"),
  );
  const step = css.slice(
    css.indexOf(".circle-os .os-week-step-text {"),
    css.indexOf(".circle-os .os-week-goal-text::placeholder"),
  );
  // Told apart by case and size, not by weight alone.
  assert.match(name, /text-transform: uppercase/);
  assert.match(name, /font-size: var\(--text-2xs\)/);
  assert.match(step, /font-size: var\(--text-base\)/);
  // Lighter than the heading it sits under, which stays at 700.
  assert.match(step, /font-weight: 500/);
  assert.match(name, /font-weight: 700/);
  // And they do not share a starting edge.
  assert.match(css, /os-week-goal-day \.os-week-step \{\s+padding-left: 14px/);

  // The goal above is drawn as Routine draws an editable line — same size,
  // weight and tracking as a habit's own text, which is what makes the two
  // Apps read as one. Sai: "The main text is still not the same size as the
  // habit text."
  const habitRow = css.slice(
    css.indexOf(".circle-os .os-extra-mission-copy {"),
    css.indexOf(".circle-os .os-extra-mission-copy {") + 200,
  );
  assert.match(habitRow, /font-size: 1\.85rem/);
  assert.match(css, /os-week-goal-text \{\s+font-size: 1\.85rem/);
  assert.match(css, /os-week-day-name \{[\s\S]*?font-size: 1\.85rem/);
  // And the date is written in the App's date colour, as it is on Today.
  assert.match(css, /os-week-date \{\s+color: var\(--c-orange\)/);
});

// Every input and textarea is forced to 16px on a phone so Safari does not zoom
// the Page on focus. Anything meant to be bigger has to say so in the same
// breath, or the size is thrown away on the only device Sai uses. He said so
// three times: "I didnt see any changes in text sizes."
test("the Week's editable lines survive the phone's 16px floor", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");
  // The floor exists and still covers every ordinary field.
  assert.match(
    css,
    /\.circle-os input,\s+\.circle-os textarea,\s+\.circle-os select \{\s+font-size: 16px !important;/,
  );
  // And the two lines drawn at habit size are exempted from it, in the same
  // media query, or they are 16px on the phone whatever the rule above says.
  const floorAt = css.indexOf("font-size: 16px !important;");
  const exemptAt = css.indexOf("textarea.os-week-goal-text");
  assert.ok(exemptAt > floorAt, "the exemption comes after the floor");
  assert.match(
    css,
    /textarea\.os-week-goal-text,\s+\.circle-os input\.os-week-day-name \{\s+font-size: 1\.85rem !important;/,
  );
  // A step stays on the floor. Below it the Page scales when the field takes
  // focus, which is what Sai hit: "It zoomed in when adding step for the goal."
  assert.doesNotMatch(css, /textarea\.os-week-step-text \{[^}]*!important/);
});
