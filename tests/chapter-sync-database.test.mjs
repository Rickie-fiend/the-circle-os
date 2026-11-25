import assert from "node:assert/strict";
import { test } from "node:test";
import { A, B, asAccount } from "./helpers/writing-cloud.mjs";
import { chapterExchange, chapterSyncDatabase } from "./helpers/chapter-sync.mjs";

test("Chapter sync owns data, returns exact receipts, and protects the original finish", async () => {
  const db = await chapterSyncDatabase([{ id: "original", version: 1, pages: [{ id: "page" }] }]);
  try {
    const run = {
      runId: "original@1", chapterId: "original", chapterVersion: 1, currentPageId: "page", furthestPageId: "page",
      status: "in-progress", startedAt: "2026-11-23T09:00:00Z", updatedAt: "2026-11-23T09:00:00Z", answers: [],
    };
    const first = { id: crypto.randomUUID(), baseRevision: 0, run };
    assert.deepEqual(await chapterExchange(db, A, A, first), { status: "accepted", revision: 1 });
    assert.deepEqual(await chapterExchange(db, A, A, first), { status: "accepted", revision: 1 });
    await assert.rejects(chapterExchange(db, A, A, { ...first, baseRevision: 1 }), /reused/);
    assert.deepEqual(await chapterExchange(db, B), []);
    await assert.rejects(chapterExchange(db, B, A, first), /Invalid Chapter owner/);
    await assert.rejects(chapterExchange(db, null, A, null, "anon"), /permission denied/);
    await assert.rejects(chapterExchange(db, A, A, null, "service_role"), /permission denied/);
    await assert.rejects(asAccount(db, B, tx => tx.query("select run from circle_private.chapter_sync_runs")), /permission denied/);
    await assert.rejects(chapterExchange(db, A, A, {
      ...first, id: crypto.randomUUID(), run: { ...run, runId: "original@2", chapterVersion: 2 },
    }), /Invalid Chapter edition/);
    const finished = { ...run, status: "completed", completedAt: run.startedAt, imprintFinish: { day: "2026-11-23", timeZone: "Asia/Bangkok" } };
    const finish = { id: crypto.randomUUID(), baseRevision: 1, run: finished };
    assert.deepEqual(await chapterExchange(db, A, A, finish), { status: "accepted", revision: 2 });
    assert.deepEqual(await chapterExchange(db, A, A, finish), { status: "accepted", revision: 2 });
    const head = { revision: 2, run: finished };
    assert.deepEqual(await chapterExchange(db, A, A, { ...first, id: crypto.randomUUID(), baseRevision: 2 }), { status: "conflict", head });
    assert.deepEqual(await chapterExchange(db, A), [head]);
  } finally {
    await db.close();
  }
});

test("deleting a Chapter owner removes runs and receipts and rejects stale requests", async () => {
  const db = await chapterSyncDatabase([{ id: "original", version: 1, pages: [{ id: "page" }] }]);
  try {
    const run = {
      runId: "original@1", chapterId: "original", chapterVersion: 1, currentPageId: "page", furthestPageId: "page",
      status: "in-progress", startedAt: "2026-11-23T09:00:00Z", answers: [],
    };
    const first = { id: crypto.randomUUID(), baseRevision: 0, run };
    const pending = { ...first, id: crypto.randomUUID(), baseRevision: 1 };
    await chapterExchange(db, A, A, first);
    await chapterExchange(db, B, B, first);
    const other = await chapterExchange(db, B);
    await db.query("delete from auth.users where id = $1", [A]);
    const count = await db.query(`
      select (select count(*)::int from circle_private.chapter_sync_runs where owner_id = $1) as runs,
             (select count(*)::int from circle_private.chapter_sync_receipts where owner_id = $1) as receipts
    `, [A]);
    assert.deepEqual(count.rows, [{ runs: 0, receipts: 0 }]);
    await assert.rejects(chapterExchange(db, A), /authenticated account/i);
    await assert.rejects(chapterExchange(db, A, A, first), /authenticated account/i);
    await assert.rejects(chapterExchange(db, A, A, pending), /authenticated account/i);
    await assert.rejects(chapterExchange(db, B, A, pending), /Invalid Chapter owner/);
    assert.deepEqual(await chapterExchange(db, B), other);
  } finally {
    await db.close();
  }
});
