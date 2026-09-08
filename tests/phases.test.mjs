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
test("the App arrives in three phases, each earned by the one before", () => {
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
  assert.equal(SETUP_CHAPTER.week, "week-setup");
  assert.equal(lockedUntil("protocol"), "day-one");
  assert.equal(lockedUntil("week"), "week-setup");
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

  // The two that need something set up behind them wait for that chapter.
  assert.equal(appIsOpen("protocol", {}), false);
  assert.equal(appIsOpen("week", {}), false);
  assert.equal(appIsOpen("protocol", done("day-one", 2)), true);
  assert.equal(appIsOpen("week", done("day-one", 2)), false);
  assert.equal(appIsOpen("week", done("week-setup")), true);

  // Started is not answered: a chapter left half way opens nothing.
  assert.equal(
    appIsOpen("week", { "week-setup@1": { status: "in-progress" } }),
    false,
  );
});

test("days are counted in days lived, not days since installing", () => {
  // Somebody who comes back on Friday is on their second day, not their fifth.
  assert.equal(journeyDay("2026-09-01", "2026-09-01"), 1);
  assert.equal(journeyDay("2026-09-01", "2026-09-02"), 2);
  assert.equal(journeyDay("2026-09-01", "2026-09-07"), 7);

  // Nothing kept yet is day zero.
  assert.equal(journeyDay("", "2026-09-08"), 0);
  assert.equal(journeyDay(null, "2026-09-08"), 0);

  // A clock that went backwards does not open anything.
  assert.equal(journeyDay("2026-09-08", "2026-09-01"), 0);
});

test("a locked App shows its cover rather than hiding", () => {
  const page = readFileSync("app/os/locked-app-page.tsx", "utf8");
  // Hiding it would be simpler and worse: the shape of the whole thing is the
  // argument for staying. Sai: "Protocol, and Week app will have a cover
  // screen, with the disabled button."
  assert.match(page, /<CreativeButton\s+className="os-locked-app-key"\s+disabled/);
  // And it names the chapter that opens it rather than saying "locked", so he
  // knows what to go and do — and can start it from its Quest whenever.
  assert.match(page, /Opens after/);

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const protocolIsOpen = appIsOpen\("protocol", state\.chapters\.runs\)/);
  assert.match(shell, /const weekIsOpen = appIsOpen\("week", state\.chapters\.runs\)/);
  // The real Apps are behind the same gate, so a locked cover is never shown
  // beside the thing it stands in for.
  assert.match(shell, /\.\.\.\(protocolIsOpen \? \[\] : \[/);
  assert.match(shell, /\{weekIsOpen \? null : \(/);

});
