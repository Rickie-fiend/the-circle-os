import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DAY_DOOR_ORDER,
  dayDoor,
  dayOpenRunId,
  dayWasOpened,
} from "../app/os/day-door.js";

const TODAY = "2026-09-08";

/** Every door ready at once, so a test can say which one it silences. */
function allReady(overrides = {}) {
  const offers = {};
  for (const kind of DAY_DOOR_ORDER) offers[kind] = { offered: true };
  return { ...offers, ...overrides };
}

// Sai: "whenever we log into the app, splash screen act as greeting ... when
// the user first visit, the first set-up ss would be displayed. first
// onboarding ss > app."
test("setting up stands in front of everything else", () => {
  assert.equal(dayDoor(allReady(), TODAY), "day-one");

  // A person who has not answered day one has no character, no habit and no
  // goal, so nothing behind the door works yet.
  assert.equal(
    dayDoor(allReady({ "day-one": { offered: false } }), TODAY),
    "week-setup",
  );
  assert.equal(
    dayDoor(
      allReady({ "day-one": { offered: false }, "week-setup": { offered: false } }),
      TODAY,
    ),
    "log-setup",
  );
});

// Sai: "so when its time to review for the week, ss will inform that, and to
// continue the process."
test("the week's hinge stands in front of the day's greeting", () => {
  const ladderDone = {
    "day-one": { offered: false },
    "week-setup": { offered: false },
    "log-setup": { offered: false },
  };
  // A week ends whether or not he looks at it, and the one evening it can be
  // read honestly is the one it ended on.
  assert.equal(dayDoor(allReady(ladderDone), TODAY), "week-review");
  assert.equal(
    dayDoor(allReady({ ...ladderDone, "week-review": { offered: false } }), TODAY),
    "day-open",
  );
});

// Sai: "for that day whenever the user login, it will be to use app."
test("an ordinary day opens once, then the door is not there", () => {
  const ordinary = {
    "day-one": { offered: false },
    "week-setup": { offered: false },
    "log-setup": { offered: false },
    "week-review": { offered: false },
  };
  assert.equal(dayDoor(allReady(ordinary), TODAY), "day-open");

  // Put down today: not again until tomorrow.
  assert.equal(
    dayDoor(
      allReady({ ...ordinary, "day-open": { offered: true, dismissedKey: TODAY } }),
      TODAY,
    ),
    null,
  );
  // And tomorrow it is there again, from where he left it.
  assert.equal(
    dayDoor(
      allReady({ ...ordinary, "day-open": { offered: true, dismissedKey: TODAY } }),
      "2026-09-09",
    ),
    "day-open",
  );
});

test("only one door is ever open", () => {
  // Not a list of sheets to work through: one question, one answer. Whichever
  // wins, the rest wait for another opening of the App.
  const answer = dayDoor(allReady(), TODAY);
  assert.equal(typeof answer, "string");
  assert.ok(DAY_DOOR_ORDER.includes(answer));

  // Nothing ready is a person walking straight into the App.
  const none = Object.fromEntries(
    DAY_DOOR_ORDER.map((kind) => [kind, { offered: false }]),
  );
  assert.equal(dayDoor(none, TODAY), null);
  assert.equal(dayDoor({}, TODAY), null);
  assert.equal(dayDoor(undefined, TODAY), null);
});

test("a day's greeting is that day's, and either answer opens it", () => {
  const chapter = { id: "day-open", version: 1 };
  assert.equal(dayOpenRunId(chapter, TODAY), "day-open@1:2026-09-08");
  // Yesterday's greeting is a different sheet, so today's starts blank rather
  // than resuming a week-old one.
  assert.notEqual(dayOpenRunId(chapter, "2026-09-07"), dayOpenRunId(chapter, TODAY));
  assert.equal(dayOpenRunId(null, TODAY), "");

  // Finishing it opens the day. So does waving it away: a person who did that
  // has been greeted and does not need greeting again at lunchtime.
  assert.equal(dayWasOpened({ status: "completed" }), true);
  assert.equal(dayWasOpened({ status: "in-progress", dismissedAt: "2026-09-08T09:00:00.000Z" }), true);
  assert.equal(dayWasOpened({ status: "in-progress", dismissedAt: null }), false);
  assert.equal(dayWasOpened(null), false);
});

test("the App asks the door once and draws one sheet", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");

  // The order lives in day-door.js, not in four conditionals negating each
  // other across the render.
  // A pin from the Workshop stands in front; otherwise it is the button or
  // the door itself.
  assert.match(shell, /pinned \|\| \(reviewingWeekOf \? "week-review" : dayDoor\(doorOffers, dateKey\)\)/);
  for (const kind of DAY_DOOR_ORDER) {
    assert.ok(
      shell.includes(`doorKind === "${kind}"`),
      `${kind} is never drawn`,
    );
  }

  // The old shape is gone: no sheet decides its own precedence any more.
  assert.doesNotMatch(shell, /\{!dayOneDone &&\s+dayOneChapter/);
  assert.doesNotMatch(shell, /\) : dayOneDone &&\s+weekSetupDone &&\s+!logSetupDone/);
});

// Sai: "let me have a way to manually test the splash screen chapters."
test("a door can be pinned open from the Workshop", async () => {
  const store = new Map();
  const original = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
  try {
    const { readPinnedDoor, writePinnedDoor, clearPinnedDoor } = await import(
      `../app/os/day-door.js?pin=${Date.now()}`
    );
    assert.equal(readPinnedDoor(), null);

    writePinnedDoor("week-review");
    assert.equal(readPinnedDoor(), "week-review");

    // Only a real door. A name that is not one leaves whatever was there.
    writePinnedDoor("not-a-door");
    assert.equal(readPinnedDoor(), "week-review");

    // Let go the moment the sheet is answered or put down, so it can never
    // become a door somebody is stuck behind.
    clearPinnedDoor();
    assert.equal(readPinnedDoor(), null);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

test("the pin lives beside the state, not in it", () => {
  const door = readFileSync("app/os/day-door.js", "utf8");
  // A pin is one device, one moment, one person. In the synced state the first
  // sync after opening the OS rebuilt `chapters` from its runs and sessions and
  // threw it away — which is right for sync and wrong for this.
  assert.match(door, /window\.localStorage/);

  const model = readFileSync("app/os/circle-os-model.js", "utf8");
  assert.doesNotMatch(model, /pinnedDoor/);

  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  // Read during render behind the client check, never in an effect, or the App
  // paints once without the sheet and again with it.
  assert.match(shell, /const pinned = onTheClient && !pinLetGo \? readPinnedDoor\(\) : null;/);
  // And a pinned review has a week to read on a day that is not a Sunday.
  assert.match(shell, /reviewIsDue \|\| pinned === "week-review" \? weekJustEnded : ""/);
});

// Sai: "Hide The Four app session for now."
test("The Four is hidden, and nothing about it was deleted", () => {
  const mirror = readFileSync("app/os/mirror/page.tsx", "utf8");
  assert.match(mirror, /const SHOW_THE_FOUR = false;/);
  assert.match(mirror, /hidden=\{!SHOW_THE_FOUR\}/);
  // The record it reads keeps accumulating every Sunday, so turning it back on
  // puts the App back with its whole history intact.
  assert.match(mirror, /dimensionRecord\(/);
});
