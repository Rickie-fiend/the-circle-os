import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { A, B, asAccount, database } from "./helpers/writing-cloud.mjs";

test("Log sync retains original dates and corrections, reserves a slot, and rejects stale clears and foreign owners", async () => {
  const db = await database();
  try {
    await db.exec(await readFile(new URL("../supabase/migrations/20261123164208_log_record_sync.sql", import.meta.url), "utf8"));
    const rpc = (owner, operation = null, account = owner) => asAccount(db, account, async tx =>
      (await tx.query("select public.circle_log_sync($1,$2) as result", [owner, operation])).rows[0].result);
    const at = "2026-11-23T22:50:00.000Z";
    const op = {
      id: crypto.randomUUID(), baseRevision: 0, cleared: false, dateKey: "2026-11-23",
      block: { id: "one", start: "05:00", end: "06:00", createdAt: at, updatedAt: at, title: "Before six", moments: ["Moment"] },
    };
    const accepted = await rpc(A, op);
    assert.deepEqual(accepted, { status: "accepted", revision: 1 });
    assert.deepEqual(await rpc(A, op), accepted);
    await assert.rejects(rpc(A, { ...op, block: { ...op.block, title: "Changed request" } }), /reused/);
    const clash = await rpc(A, { ...op, id: crypto.randomUUID(), block: { ...op.block, id: "two" } });
    assert.equal(clash.status, "conflict");
    assert.equal(clash.head.block.id, "one");
    assert.equal((await rpc(A, { ...op, id: crypto.randomUUID(), block: { ...op.block, id: "three", start: "04:00", end: "05:00" } })).status, "accepted");
    assert.deepEqual(await rpc(B), []);
    await assert.rejects(rpc(A, op, B), /Invalid Log owner/);
    const corrected = { ...op, id: crypto.randomUUID(), baseRevision: 1, correctionId: "correction", block: { ...op.block, title: "Corrected" } };
    await assert.rejects(rpc(A, { ...corrected, block: { ...corrected.block, end: "07:00" } }), /attribution/);
    assert.deepEqual(await rpc(A, corrected), { status: "accepted", revision: 2 });
    const cleared = { ...op, id: crypto.randomUUID(), baseRevision: 2, cleared: true, block: { ...op.block, title: "", moments: [] } };
    assert.equal((await rpc(A, cleared)).revision, 3);
    const stale = await rpc(A, { ...op, id: crypto.randomUUID(), baseRevision: 2 });
    assert.equal(stale.status, "conflict");
    assert.equal(stale.head.cleared, true);
    assert.equal(stale.head.dateKey, "2026-11-23");
    assert.equal(stale.head.block.createdAt, at);
    assert.deepEqual(stale.head.corrections.map(receipt => [receipt.before.title, receipt.after.title]), [["Before six", "Corrected"], ["Corrected", ""]]);
    assert.equal((await rpc(A, { ...op, id: crypto.randomUUID(), block: { ...op.block, id: "replacement" } })).status, "accepted");
    await db.query("delete from auth.users where id=$1", [A]);
    await assert.rejects(rpc(A, op), /authenticated account/i);
    assert.deepEqual((await db.query("select count(*)::int as count from circle_private.log_sync_heads")).rows, [{ count: 0 }]);
  } finally { await db.close(); }
});
