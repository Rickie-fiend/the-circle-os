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

// After first setup, the 2026-11-06 decision removes automatic entry prompts.
test("only unfinished Day One can open automatically", () => {
  assert.equal(dayDoor(allReady(), TODAY), "day-one");

  assert.equal(
    dayDoor(allReady({ "day-one": { offered: false } }), TODAY),
    null,
  );
  assert.equal(
    dayDoor(
      allReady({ "day-one": { offered: false }, "week-setup": { offered: false } }),
      TODAY,
    ),
    null,
  );
});

test("later setups, Sunday review and greetings never interrupt entry", () => {
  const ladderDone = {
    "day-one": { offered: false },
    "week-setup": { offered: false },
    "log-setup": { offered: false },
  };
  assert.equal(dayDoor(allReady(ladderDone), TODAY), null);
  assert.equal(
    dayDoor(allReady({ ...ladderDone, "week-review": { offered: false } }), TODAY),
    null,
  );
});

// Sai: "for that day whenever the user login, it will be to use app."
test("returning tomorrow or Sunday does not bring back automatic prompts", () => {
  const ordinary = {
    "day-one": { offered: false },
    "week-setup": { offered: false },
    "log-setup": { offered: false },
    "week-review": { offered: false },
  };
  assert.equal(dayDoor(allReady(ordinary), TODAY), null);

  // A dated dismissal of a later chapter cannot change automatic entry.
  assert.equal(
    dayDoor(
      allReady({ ...ordinary, "day-open": { offered: true, dismissedKey: TODAY } }),
      TODAY,
    ),
    null,
  );
  // A later day does not reopen it either.
  assert.equal(
    dayDoor(
      allReady({ ...ordinary, "day-open": { offered: true, dismissedKey: TODAY } }),
      "2026-09-09",
    ),
    null,
  );
  assert.equal(dayDoor(allReady(ordinary), "2026-11-08"), null);
});

test("dismissing unfinished Day One does not chain another setup", () => {
  const offers = allReady({ "day-one": { offered: true, dismissedKey: TODAY } });
  const original = structuredClone(offers);
  assert.equal(dayDoor(offers, TODAY), null);
  assert.equal(dayDoor(offers, "2026-09-09"), "day-one");
  assert.deepEqual(offers, original);
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
  // A pinned chapter stands in front, then a pinned door, then the button,
  // then the door deciding for itself.
  assert.match(
    shell,
    /\(pinnedChapter \? pinnedSetupDoor \|\| "chapter" : pinnedStepDone \? null : pinned\) \|\|\s+\(reviewingWeekOf \? "week-review" : dayDoor\(doorOffers, dateKey\)\)/,
  );
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
  assert.match(shell, /pinned === "week-review" \|\| pinnedChapterId\(pinned\) === "week-review" \? weekJustEnded : ""/);
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

// Sai, on tapping a Quest step: "all those chapters will be process on splash
// screen."
test("a pin can name a chapter, not only a door", async () => {
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
    const { readPinnedDoor, writePinnedChapter, pinnedChapterId, clearPinnedDoor } =
      await import(`../app/os/day-door.js?chapter=${Date.now()}`);

    writePinnedChapter("declare-vision");
    assert.equal(readPinnedDoor(), "chapter:declare-vision");
    assert.equal(pinnedChapterId("chapter:declare-vision"), "declare-vision");

    // A door is still a door: one mechanism, two kinds of name.
    assert.equal(pinnedChapterId("week-review"), null);
    assert.equal(pinnedChapterId(null), null);

    // Empty names nothing, so a stray write cannot open an empty sheet.
    writePinnedChapter("   ");
    assert.equal(readPinnedDoor(), "chapter:declare-vision");

    clearPinnedDoor();
    assert.equal(readPinnedDoor(), null);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

test("a pinned chapter is read in the sheet every chapter uses", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  assert.match(shell, /const pinnedChapter = pinnedStepDone \? null : pinnedCandidate/);
  assert.match(shell, /doorKind === "chapter" && pinnedChapter && pinnedChapterRun/);
  // Its run is the chapter's own, so a step answered here counts everywhere:
  // in the Quest's progress, in the setup gates, in the record.
  assert.match(shell, /state\.chapters\.runs\[chapterRunId\(pinnedChapter\)\]/);
  assert.match(shell, /function savePinnedChapterRun\(nextRun: ChapterRun\)/);
});
