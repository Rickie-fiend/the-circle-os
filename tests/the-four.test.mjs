import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createEmptyState, declareLife } from "../app/os/circle-os-model.js";
import {
  DIMENSION_WINDOW_WEEKS,
  dimensionRecord,
  dimensionWeeks,
  starvedDimension,
} from "../app/os/dimension-record.js";
import { recordWeekReview } from "../app/os/week-app-model.js";

// A Sunday. Before eight in the evening the week being planned is still this
// one; after it, the next.
const SUNDAY = "2026-09-06";

function weekBack(count) {
  const date = new Date("2026-09-07T12:00:00");
  date.setDate(date.getDate() - count * 7);
  return date.toISOString().slice(0, 10);
}

function lived(entries) {
  let state = createEmptyState();
  for (const [back, fed] of entries) {
    state = recordWeekReview(state, weekBack(back), { fed });
  }
  return state;
}

test("the window is six months of weeks, ending on the week being planned", () => {
  assert.equal(DIMENSION_WINDOW_WEEKS, 26);
  const weeks = dimensionWeeks(SUNDAY, 21);
  assert.equal(weeks.length, 26);
  // Sunday evening has already rolled: the last square is the week he is about
  // to live, not the one just finished.
  assert.equal(weeks.at(-1), "2026-09-07");
  assert.equal(weeks[0], weekBack(25));
  // In order, oldest first, so a row can be drawn straight from it.
  assert.deepEqual([...weeks].sort(), weeks);
});

test("each part of a life carries what was put into it", () => {
  const state = lived([
    [1, "mind"],
    [2, "mind"],
    [4, "mind"],
    [3, "body"],
    [6, "social"],
  ]);
  const record = dimensionRecord(state, SUNDAY, 21);
  const by = Object.fromEntries(record.map((row) => [row.dimension, row]));

  assert.equal(by.mind.fed, 3);
  assert.equal(by.body.fed, 1);
  assert.equal(by.spirit.fed, 0);
  assert.equal(by.social.fed, 1);

  // The squares land on the weeks they happened in, not merely in a count.
  assert.equal(by.mind.weeks.filter((week) => week.fed).length, 3);
  assert.equal(by.mind.weeks.at(-2).fed, true, "last week fed mind");
  assert.equal(by.mind.weeks.at(-1).fed, false, "the week ahead is not lived");

  // Never fed is a different thing from a long time ago.
  assert.equal(by.spirit.weeksSince, null);
  assert.equal(by.mind.weeksSince, 1);
  assert.equal(by.social.weeksSince, 6);
});

test("the trait he named is the name the part answers to", () => {
  let state = lived([[1, "mind"]]);
  state = declareLife(state, "character", { mind: "clear-headed", starting: "mind" });
  const record = dimensionRecord(state, SUNDAY, 21);
  const mind = record.find((row) => row.dimension === "mind");
  assert.equal(mind.trait, "clear-headed");
});

// What it says out loud is the part that has gone hungry, never the strongest.
test("the starved part is the one it speaks about", () => {
  const some = dimensionRecord(lived([[1, "mind"], [6, "social"]]), SUNDAY, 21);
  // Never fed beats a long time ago: a part nobody has named is further away
  // than one that has merely lapsed, even six weeks of lapsed.
  assert.equal(starvedDimension(some).weeksSince, null);
  // Two parts have never been fed. It picks the first of them in the order the
  // four are always written, so the headline is the same sentence each time he
  // opens the tab rather than alternating between two equally true ones.
  assert.equal(starvedDimension(some).dimension, "body");

  // Nothing is said when nothing is starving. One week feeds one part, so four
  // parts come round in four weeks: this is a life in perfect balance, and it
  // must not be told that something is wrong with it.
  const balanced = dimensionRecord(
    lived([[0, "mind"], [1, "body"], [2, "spirit"], [3, "social"]]),
    SUNDAY,
    21,
  );
  assert.equal(starvedDimension(balanced), null);

  // A month is the line, because that is when the rotation has been missed.
  const lapsed = dimensionRecord(
    lived([[5, "mind"], [0, "body"], [1, "spirit"], [2, "social"]]),
    SUNDAY,
    21,
  );
  assert.equal(starvedDimension(lapsed).dimension, "mind");
  assert.equal(starvedDimension(lapsed).weeksSince, 5);
});

test("nothing here is a score", () => {
  // Depth only accumulates. A count that falls is a punishment, and there is no
  // currency here to earn or lose — a filled week is a week he said was fed.
  const older = dimensionRecord(lived([[20, "mind"]]), SUNDAY, 21);
  const mind = older.find((row) => row.dimension === "mind");
  assert.equal(mind.fed, 1, "a week off the window's near end still counts");

  // Even far outside the window it is never taken back. The window is how far
  // the eye reaches, not how much of a life counts.
  const ancient = dimensionRecord(lived([[80, "mind"]]), SUNDAY, 21);
  const forgotten = ancient.find((row) => row.dimension === "mind");
  assert.equal(forgotten.fed, 1);
  assert.equal(
    forgotten.weeks.filter((week) => week.fed).length,
    0,
    "off the picture, still on the record",
  );
});

test("the Page reads the record rather than keeping its own", () => {
  const page = readFileSync("app/os/mirror/page.tsx", "utf8");
  assert.match(page, /dimensionRecord\(state, getDateKey\(\), new Date\(\)\.getHours\(\)\)/);
  assert.match(page, /starvedDimension\(dimensions\)/);
  // It speaks about the starved part, and says never differently from lapsed.
  assert.match(page, /has never been fed\./);
  assert.match(page, /has not been fed in \$\{row\.weeksSince\} weeks\./);
});

// Sai: "And why is this not the app box standard?"
test("The Four is an App Box, not something shaped like one", () => {
  const page = readFileSync("app/os/mirror/page.tsx", "utf8");
  const css = readFileSync("app/os/os-app.css", "utf8");

  // The real anatomy, so the forehead, the Main position and the footer are
  // the App's own rather than a margin that imitates them.
  const at = page.indexOf('className="vision-four-app"');
  const box = page.slice(at, page.indexOf("</PageLayout>", at));
  assert.match(page, /<PageLayout\s+className="vision-four-app"/);
  assert.match(box, /headerLeft=\{<p className="os-card-label">The Four<\/p>\}/);
  assert.match(box, /<div className="os-page-main">\s*<h2>/);
  assert.match(box, /className="os-page-sub vision-four-rows"/);
  assert.match(box, /vision-four-window/);

  // The box no longer carries a hand-rolled copy of the box's own shape.
  const style = css.slice(
    css.indexOf(".circle-os .vision-four-app {"),
    css.indexOf(".circle-os .vision-four-app h2 {"),
  );
  assert.doesNotMatch(style, /min-height/);
  assert.doesNotMatch(style, /padding:/);
  assert.doesNotMatch(css, /\.vision-four-rows \{[\s\S]*?margin-top: var\(--os-label-gap\)/);

  // And the sentence it says out loud lives in the box, said once. It used to
  // sit outside it under a second copy of the App's own label.
  assert.doesNotMatch(page, /<p className="os-eyebrow">The Four<\/p>/);
});
