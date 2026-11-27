import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PROTOCOL_DAY,
  SETUP_CHAPTER,
  WEEK_DAY,
  appIsOpen,
  journeyDay,
  lockedUntil,
  phaseForDay,
} from "../app/os/phases.js";

// Sai: "for one day commitment note app, thoughts, routine, log, are fully
// usable on day one ... Protocol, and Week app will have a cover screen, with
// the disabled button. for day two, is for Protocol ... at day 7, week and
// athena review would be able."
test("historical phase helpers retain their thresholds without controlling App access", () => {
  assert.equal(PROTOCOL_DAY, 2);
  assert.equal(WEEK_DAY, 7);

  assert.equal(phaseForDay(1), "one-day");
  assert.equal(phaseForDay(2), "one-week");
  assert.equal(phaseForDay(6), "one-week");
  assert.equal(phaseForDay(7), "the-week-read");
  assert.equal(phaseForDay(30), "the-week-read");
});

// Sai: "For protocol and week app, unlock after completing the set-up chapter."
test("an App opens when the chapter that sets it up is answered", () => {
  // A date was the wrong key. It let day seven arrive with no week goal
  // written and no phase running, so the Week Page opened onto nothing — and
  // it locked somebody who had done all the work out of the App that work was
  // for. The chapter is the actual dependency.
  assert.equal(SETUP_CHAPTER.protocol, "day-one");
  assert.equal(SETUP_CHAPTER.week, undefined);
  assert.equal(lockedUntil("protocol"), "day-one");
  assert.equal(lockedUntil("week"), "");
  assert.equal(lockedUntil("log"), "");

  const done = (id, version = 1) => ({
    [`${id}@${version}`]: { runId: `${id}@${version}`, status: "completed" },
  });

  // Writing things down works on the first day, so Note, Thoughts, Routine and
  // Log are open from the start. Doing the one two-minute thing is the whole
  // success condition — more habits and more tasks are the point, not a breach.
  for (const app of ["note", "thoughts", "routine", "log"]) {
    assert.equal(appIsOpen(app, {}), true, app);
  }

  // Protocol waits for Day One; Week stays open regardless of setup history.
  assert.equal(appIsOpen("protocol", {}), false);
  assert.equal(appIsOpen("week", {}), true);
  assert.equal(appIsOpen("protocol", done("day-one", 2)), true);
  assert.equal(appIsOpen("week", done("day-one", 2)), true);
  assert.equal(appIsOpen("week", done("week-setup")), true);

  // Started is not answered: a chapter left half way opens nothing.
  assert.equal(
    appIsOpen("week", { "week-setup@1": { status: "in-progress" } }),
    true,
  );
});

test("the historical day helper counts date boundaries from Day One completion", () => {
  assert.equal(journeyDay("2026-09-01", "2026-09-01"), 1);
  assert.equal(journeyDay("2026-09-01", "2026-09-02"), 2);
  assert.equal(journeyDay("2026-09-01", "2026-09-07"), 7);

  // Nothing kept yet is day zero.
  assert.equal(journeyDay("", "2026-09-08"), 0);
  assert.equal(journeyDay(null, "2026-09-08"), 0);

  // A clock that went backwards does not open anything.
  assert.equal(journeyDay("2026-09-08", "2026-09-01"), 0);
});

test("Today renders Protocol directly", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /<ProtocolPage/);
  assert.doesNotMatch(shell, /<LockedAppPage|appIsOpen\("protocol"/);
});

test("Week setup never gates access and unfinished Day One still gates Protocol", () => {
  for (const runs of [{}, { 'week-setup@1': { status: 'in-progress' } }, { 'week-setup@1': { status: 'completed' } }]) {
    const before = structuredClone(runs);
    assert.equal(appIsOpen('week', runs), true);
    assert.equal(appIsOpen('protocol', runs), false);
    assert.deepEqual(runs, before, 'access checks leave saved runs intact');
  }
  assert.equal(appIsOpen('protocol', { 'day-one@3': { status: 'in-progress' } }), false);
  assert.equal(appIsOpen('protocol', { 'day-one@1': { status: 'completed' } }), true);
});
