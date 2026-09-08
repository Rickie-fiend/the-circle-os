import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PROTOCOL_DAY,
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
test("the App arrives in three phases, each earned by the one before", () => {
  assert.equal(PROTOCOL_DAY, 2);
  assert.equal(WEEK_DAY, 7);

  assert.equal(phaseForDay(1), "one-day");
  assert.equal(phaseForDay(2), "one-week");
  assert.equal(phaseForDay(6), "one-week");
  assert.equal(phaseForDay(7), "the-week-read");
  assert.equal(phaseForDay(30), "the-week-read");
});

test("day one hands over everything that only needs a person to be present", () => {
  // Writing things down works on the first day. Note, Thoughts, Routine and Log
  // are open from the start, and doing the one two-minute thing is the whole
  // success condition — more habits and more tasks are the point, not a breach.
  for (const app of ["note", "thoughts", "routine", "log"]) {
    assert.equal(appIsOpen(app, 1), true, app);
  }

  // The two that need something lived behind them wait for it. A Protocol on
  // day one is a commitment with no evidence; a Week Page has no week to show.
  assert.equal(appIsOpen("protocol", 1), false);
  assert.equal(appIsOpen("week", 1), false);
});

test("each App opens on the day its argument exists", () => {
  assert.equal(appIsOpen("protocol", PROTOCOL_DAY - 1), false);
  assert.equal(appIsOpen("protocol", PROTOCOL_DAY), true);
  // And stays open: the Protocol does not close again on day seven.
  assert.equal(appIsOpen("protocol", WEEK_DAY), true);

  assert.equal(appIsOpen("week", WEEK_DAY - 1), false);
  assert.equal(appIsOpen("week", WEEK_DAY), true);

  assert.equal(lockedUntil("protocol"), PROTOCOL_DAY);
  assert.equal(lockedUntil("week"), WEEK_DAY);
  assert.equal(lockedUntil("log"), 0);
});

test("days are counted in days lived, not days since installing", () => {
  // Somebody who comes back on Friday is on their second day, not their fifth.
  assert.equal(journeyDay("2026-09-01", "2026-09-01"), 1);
  assert.equal(journeyDay("2026-09-01", "2026-09-02"), 2);
  assert.equal(journeyDay("2026-09-01", "2026-09-07"), 7);

  // Nothing kept yet is day zero, and everything gated is shut.
  assert.equal(journeyDay("", "2026-09-08"), 0);
  assert.equal(journeyDay(null, "2026-09-08"), 0);
  assert.equal(appIsOpen("protocol", 0), false);
  assert.equal(appIsOpen("week", 0), false);

  // A clock that went backwards does not open anything.
  assert.equal(journeyDay("2026-09-08", "2026-09-01"), 0);
});

test("a locked App shows its cover rather than hiding", () => {
  const page = readFileSync("app/os/locked-app-page.tsx", "utf8");
  // Hiding it would be simpler and worse: the shape of the whole thing is the
  // argument for staying. Sai: "Protocol, and Week app will have a cover
  // screen, with the disabled button."
  assert.match(page, /<CreativeButton\s+className="os-locked-app-key"\s+disabled/);
  assert.match(page, /Opens on day \$\{opensOn\}/);
  assert.match(page, /Opens tomorrow/);

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const protocolIsOpen = appIsOpen\("protocol", journeyDayNumber\)/);
  assert.match(shell, /const weekIsOpen = appIsOpen\("week", journeyDayNumber\)/);
  // The real Apps are behind the same gate, so a locked cover is never shown
  // beside the thing it stands in for.
  assert.match(shell, /\.\.\.\(protocolIsOpen \? \[\] : \[/);
  assert.match(shell, /\{weekIsOpen \? null : \(/);

  // Counted from the day one run being completed, in Circle days.
  assert.match(shell, /const journeyDayNumber = journeyDay\(dayOneKeptOn, dateKey\)/);
});
