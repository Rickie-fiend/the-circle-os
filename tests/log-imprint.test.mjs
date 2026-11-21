import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyState, ensureDay, mergeServerState } from "../app/os/circle-os-model.js";
import { logClearingReceipt } from "../app/os/log-history.js";
import { captureLogImprint, logImprintSources } from "../app/os/home/imprint-log-activity.ts";
import { projectLocalImprint } from "../app/os/home/imprint-local-activity.ts";

test("Log end time follows the slot across midnight, DST, and the Circle boundary", () => {
  const previousZone = process.env.TZ;
  process.env.TZ = "Asia/Bangkok";
  try {
    assert.deepEqual(captureLogImprint("2026-11-22", "23:00", "00:00"), {
      endAt: "2026-11-22T17:00:00.000Z", timeZone: "Asia/Bangkok",
    });
    assert.equal(captureLogImprint("2026-11-22", "05:00", "06:00").endAt, "2026-11-22T23:00:00.000Z");
    process.env.TZ = "America/New_York";
    assert.equal(captureLogImprint("2026-03-07", "01:00", "02:00"), undefined);
    assert.equal(captureLogImprint("2026-10-31", "00:00", "01:00"), undefined);
    assert.equal(captureLogImprint("2026-03-07", "03:00", "04:00").endAt, "2026-03-08T08:00:00.000Z");
  } finally {
    if (previousZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousZone;
  }
});

test("the first qualifying source owns the shared day clock and clearing retains its age", () => {
  const day = "2026-11-22";
  const iso = hour => `${day}T${hour}:00:00.000Z`;
  const block = { id: "walk", title: "Walk", start: "14:00", end: "15:00", createdAt: iso("11"),
    imprintLog: { endAt: iso("08"), timeZone: "Asia/Bangkok" } };
  const state = ensureDay(createEmptyState(), day);
  state.days[day].timeBlocks = [block, { ...block, id: "old", imprintLog: undefined }];
  const project = (state, hour, tasks) => projectLocalImprint({}, tasks, {}, logImprintSources(state.days), Date.parse(iso(hour)));
  assert.deepEqual(project(state, "10"), []);
  const [late] = project(state, "11");
  assert.equal(late.at, iso("08"));
  assert.deepEqual(late.sources, [`log:${day}:walk`]);
  const use = { origin: "week", day, at: iso("10"), timeZone: "Asia/Bangkok" };
  const tasks = { items: { check: { status: "completed", imprint: { ...use, operation: "check", firstUses: [use] } } } };
  const [both] = project(state, "11", tasks);
  assert.equal(both.at, iso("10"));
  assert.equal(both.sources.length, 2);
  const cleared = structuredClone(state);
  cleared.days[day].timeBlocks = [];
  cleared.days[day].logCorrections = logClearingReceipt(cleared.days[day], block, iso("12"));
  assert.deepEqual(project(cleared, "12"), []);
  const merged = mergeServerState(cleared, state);
  assert.ok(!merged.days[day].timeBlocks.some(record => record.id === block.id));
  assert.deepEqual(project(merged, "12", tasks).map(({ at, sources }) => ({ at, sources })),
    [{ at: iso("10"), sources: ["task:once:check"] }]);
  const next = { ...block, id: "later", createdAt: iso("13"), imprintLog: { ...block.imprintLog, endAt: iso("14") } };
  merged.days[day].timeBlocks.push(next);
  assert.deepEqual(project(merged, "13"), []);
  assert.equal(project(merged, "14")[0].at, iso("08"));
});
