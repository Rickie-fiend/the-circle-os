import assert from "node:assert/strict";
import test from "node:test";

import {
  blockText,
  priceDays,
  pricingRatio,
} from "../app/os/athena-pricing-model.js";
import {
  mergeAthenaMemory,
  normalizeAthenaMemory,
  serializeAthenaMemoryMarkdown,
} from "../app/os/athena-memory-model.js";

const day = (date, blocks) => ({
  date,
  timeBlocks: blocks.map(([start, end, activity, moments = []]) => ({
    start,
    end,
    activity,
    moments,
  })),
});

test("a moment is priced, not only the block's title", () => {
  // The walk is the title; the cigarette is only ever written underneath it.
  const block = { activity: "Walk", moments: ["Smoke"] };
  assert.match(blockText(block), /Walk/);
  assert.match(blockText(block), /Smoke/);

  const pricing = priceDays([day("2026-09-01", [["19:00", "20:00", "Walk", ["Smoke"]]])]);
  const ids = pricing.categories.map((category) => category.id);
  assert.ok(ids.includes("walking"));
  assert.ok(ids.includes("smoking"), "smoking hidden in a moment must still be priced");
});

test("counts hours rather than blocks, and reports a share of recorded time", () => {
  const pricing = priceDays([
    day("2026-09-01", [
      ["09:00", "12:00", "Walk"],
      ["12:00", "13:00", "Lunch"],
    ]),
  ]);

  assert.equal(pricing.recordedDays, 1);
  assert.equal(pricing.recordedHours, 4);
  const walking = pricing.categories.find((category) => category.id === "walking");
  assert.equal(walking.hours, 3);
  assert.equal(walking.share, 75);
  assert.equal(walking.hoursPerRecordedDay, 3);
});

test("a block crossing midnight lasts an hour, not minus twenty-three", () => {
  const pricing = priceDays([day("2026-09-01", [["23:30", "00:30", "Walk"]])]);
  assert.equal(pricing.recordedHours, 1);
});

test("categories overlap, so shares are per category and need not sum to 100", () => {
  const pricing = priceDays([day("2026-09-01", [["19:00", "20:00", "Walk", ["Smoke"]]])]);
  const total = pricing.categories.reduce((sum, category) => sum + category.share, 0);
  assert.equal(pricing.overlapping, true);
  assert.ok(total > 100, "a walk that is also a smoke is counted in both");
});

test("a first window reports no change rather than a rise from nothing", () => {
  const pricing = priceDays([day("2026-09-01", [["09:00", "10:00", "Walk"]])], {
    windowDays: 7,
  });
  assert.equal(pricing.categories[0].changePerDay, null);
});

test("a second window is compared against the one before it", () => {
  const quiet = ["2026-09-01", "2026-09-02"].map((date) =>
    day(date, [["09:00", "10:00", "Walk"]]),
  );
  const busy = ["2026-09-03", "2026-09-04"].map((date) =>
    day(date, [["09:00", "12:00", "Walk"]]),
  );

  const pricing = priceDays([...quiet, ...busy], { windowDays: 2 });
  const walking = pricing.categories.find((category) => category.id === "walking");
  assert.equal(walking.hoursPerRecordedDay, 3);
  assert.equal(walking.previousHoursPerRecordedDay, 1);
  assert.equal(walking.changePerDay, 2);
});

test("a ratio is null rather than invented when one side was never recorded", () => {
  const pricing = priceDays([day("2026-09-01", [["09:00", "10:00", "Walk"]])]);
  assert.equal(pricingRatio(pricing, "walking", "training"), null);
  assert.equal(pricingRatio(pricing, "walking", "walking"), 1);
});

test("a day with no recorded blocks is not counted as a recorded day", () => {
  const pricing = priceDays([
    day("2026-09-01", [["09:00", "10:00", "Walk"]]),
    { date: "2026-09-02", timeBlocks: [] },
  ]);
  assert.equal(pricing.recordedDays, 1);
});

test("memory carries pricing, and the side that saw more days wins a merge", () => {
  const pricing = priceDays([
    day("2026-09-01", [["09:00", "10:00", "Walk"]]),
    day("2026-09-02", [["09:00", "10:00", "Walk"]]),
  ]);

  const memory = normalizeAthenaMemory({ updatedAt: "2026-09-02T06:00:00.000Z", pricing });
  assert.equal(memory.pricing.recordedDays, 2);
  assert.match(serializeAthenaMemoryMarkdown(memory, "p_test"), /What the days cost/);

  // A later phone save that never priced anything must not erase the costing.
  const merged = mergeAthenaMemory(memory, { updatedAt: "2026-09-03T06:00:00.000Z" });
  assert.equal(merged.pricing.recordedDays, 2);
});

test("pricing with no categories is dropped rather than stored empty", () => {
  const memory = normalizeAthenaMemory({ pricing: { recordedDays: 3, categories: [] } });
  assert.equal(memory.pricing, null);
});
