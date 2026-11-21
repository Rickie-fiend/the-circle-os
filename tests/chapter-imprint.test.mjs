import assert from "node:assert/strict";
import test from "node:test";
import { projectLocalImprint, stampChapterFinish } from "../app/os/home/imprint-local-activity.ts";
import { writingAttribution } from "../app/os/writing-model.js";

test("new Chapter finishes share one Circle day and keep their original age on retry", () => {
  const zone = "Asia/Bangkok";
  const at = "2026-11-21T22:59:00.000Z";
  const finish = { status: "completed", completedAt: at };
  const timing = time => {
    const { day, timeZone } = writingAttribution(time, zone);
    return { day, timeZone };
  };
  const stamped = stampChapterFinish({ status: "in-progress" }, finish, at, timing(at));
  assert.equal(stamped.imprintFinish.day, "2026-11-21");
  assert.strictEqual(stampChapterFinish(finish, finish, at, timing(at)), finish);
  assert.deepEqual(stampChapterFinish(stamped, finish, at, { day: "2026-11-22", timeZone: "UTC" }), stamped);
  const later = "2026-11-21T23:00:00.000Z";
  const project = chapters => projectLocalImprint({}, undefined, undefined, [], Date.parse(later), chapters);
  const [first, afterSix] = project({
    "chapter@1": stamped, "second@2": stamped, old: finish,
    "weekly@1:2026-11-15": stampChapterFinish(undefined, { ...finish, completedAt: later }, later, timing(later)),
  });
  assert.equal(first.at, at);
  assert.equal(first.group, "starting");
  assert.deepEqual(first.sources, ["chapter:chapter@1", "chapter:second@2"]);
  assert.equal(afterSix.day, "2026-11-22");
  const draft = { status: "in-progress", completedAt: null };
  assert.strictEqual(stampChapterFinish(undefined, draft, at, timing(at)), draft);
  assert.deepEqual(project({ draft, old: finish }), []);
});
