import assert from "node:assert/strict";
import test from "node:test";

import {
  CATEGORY_DIMENSION,
  DIMENSIONS,
  priceDays,
  priceWeek,
} from "../app/os/athena-pricing-model.js";

const day = (date, blocks) => ({
  date,
  timeBlocks: blocks.map(([start, end, activity, moments = []]) => ({
    start,
    end,
    activity,
    moments,
  })),
});

const dimension = (pricing, id) =>
  pricing.dimensions.find((entry) => entry.id === id);

test("an hour is spent once, even when two categories of one dimension match", () => {
  // "Walk to the gym" is both walking and training. Both feed Body. It is one
  // hour of Body, not two — this is the whole reason dimensions dedupe.
  const pricing = priceDays([day("2026-09-01", [["09:00", "10:00", "Walk to the gym"]])]);

  assert.equal(pricing.categories.find((c) => c.id === "walking").hours, 1);
  assert.equal(pricing.categories.find((c) => c.id === "training").hours, 1);
  assert.equal(dimension(pricing, "body").hours, 1);
});

test("one block feeding two different dimensions counts for both", () => {
  const pricing = priceDays([day("2026-09-01", [["09:00", "10:00", "Read with mom"]])]);
  assert.equal(dimension(pricing, "mind").hours, 1);
  assert.equal(dimension(pricing, "social").hours, 1);
});

test("share is of directed hours, so sleep and meals never dilute it", () => {
  const pricing = priceDays([
    day("2026-09-01", [
      ["09:00", "10:00", "Walk"],
      ["10:00", "18:00", "Sleep"],
      ["18:00", "19:00", "Dinner"],
    ]),
  ]);

  assert.equal(pricing.recordedHours, 10);
  assert.equal(pricing.directedHours, 1);
  // One directed hour, all of it Body.
  assert.equal(dimension(pricing, "body").share, 100);
});

test("sleep, meals and upkeep are neither a dimension nor outside the four", () => {
  const pricing = priceDays([
    day("2026-09-01", [
      ["08:00", "09:00", "Sleep"],
      ["12:00", "13:00", "Lunch"],
      ["13:00", "14:00", "Shower"],
    ]),
  ]);

  assert.equal(pricing.directedHours, 0);
  assert.deepEqual(pricing.outside, []);
  assert.ok(pricing.dimensions.every((entry) => entry.hours === 0));
});

test("hours that feed none of the four are named, not hidden and not scored", () => {
  const pricing = priceDays([day("2026-09-01", [["19:00", "20:00", "Walk", ["Smoke"]]])]);
  const outside = pricing.outside.map((entry) => entry.id);

  assert.ok(outside.includes("smoking"));
  // The same hour still feeds Body — outside is a statement about the category,
  // never a verdict on the hour.
  assert.equal(dimension(pricing, "body").hours, 1);
});

test("a dimension with no hours is reported as unfed rather than missing", () => {
  const pricing = priceDays([day("2026-09-01", [["09:00", "10:00", "Walk"]])]);

  assert.equal(pricing.dimensions.length, DIMENSIONS.length);
  assert.equal(dimension(pricing, "social").fed, false);
  assert.equal(dimension(pricing, "body").fed, true);
});

test("his own trait beats the default table", () => {
  const blocks = [day("2026-09-01", [["09:00", "10:00", "Walk"]])];

  assert.equal(CATEGORY_DIMENSION.walking, "body");
  const asSpirit = priceDays(blocks, { traitByCategory: { walking: "spirit" } });

  assert.equal(dimension(asSpirit, "spirit").hours, 1);
  assert.equal(dimension(asSpirit, "body").hours, 0);
});

test("a week is priced Monday to Sunday and compared with the week before", () => {
  const quiet = ["2026-08-24", "2026-08-25"].map((date) =>
    day(date, [["09:00", "10:00", "Walk"]]),
  );
  const busy = ["2026-08-31", "2026-09-01"].map((date) =>
    day(date, [["09:00", "12:00", "Walk"]]),
  );
  // Two weeks back, and the Monday after: outside both windows.
  const edges = [
    day("2026-08-23", [["09:00", "23:00", "Walk"]]),
    day("2026-09-07", [["09:00", "23:00", "Walk"]]),
  ];

  const week = priceWeek([...quiet, ...busy, ...edges], "2026-08-31");

  assert.equal(week.weekOf, "2026-08-31");
  assert.equal(week.from, "2026-08-31");
  assert.equal(week.to, "2026-09-01");
  assert.equal(week.recordedDays, 2, "the neighbouring days must not leak in");
  assert.equal(dimension(week, "body").hoursPerRecordedDay, 3);
  assert.equal(dimension(week, "body").previousHoursPerRecordedDay, 1);
  assert.equal(dimension(week, "body").changePerDay, 2);
});

test("the Sunday before a Monday belongs to the week being compared against", () => {
  const week = priceWeek(
    [
      day("2026-08-31", [["09:00", "10:00", "Walk"]]),
      // Sunday 30 August closes the previous Circle week, not this one.
      day("2026-08-30", [["09:00", "13:00", "Walk"]]),
    ],
    "2026-08-31",
  );

  assert.equal(week.recordedDays, 1);
  assert.equal(dimension(week, "body").hoursPerRecordedDay, 1);
  assert.equal(dimension(week, "body").previousHoursPerRecordedDay, 4);
});

test("a first week reports no change rather than a rise from nothing", () => {
  const week = priceWeek([day("2026-08-31", [["09:00", "10:00", "Walk"]])], "2026-08-31");
  assert.equal(dimension(week, "body").changePerDay, null);
});

test("a week with nothing recorded prices to zero without throwing", () => {
  const week = priceWeek([], "2026-08-31");
  assert.equal(week.recordedDays, 0);
  assert.equal(week.directedHours, 0);
  assert.ok(week.dimensions.every((entry) => entry.fed === false));
});
