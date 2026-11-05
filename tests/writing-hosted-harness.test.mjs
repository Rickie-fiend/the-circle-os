import assert from "node:assert/strict";
import test from "node:test";
import { A, B, database, remote } from "./helpers/writing-cloud.mjs";
import { runHostedChecks, validateWitness, verifyOwnWitness } from "../app/os/sync-check/hosted-checks.js";
import { POST } from "../app/os/sync-check/service-role/route.ts";

test("hosted harness exercises real SQL and coordinator with isolated same-ID accounts", async () => {
  const db = await database();
  try {
    const results = [];
    const a = await runHostedChecks({ owner: `account:${A}`, remote: remote(db, A), report: line => results.push(line) });
    const b = await runHostedChecks({ owner: `account:${B}`, remote: remote(db, B), witness: a, report: line => results.push(line) });
    assert.equal(a.entryId, b.entryId);
    assert.equal(results.length, 11);
    await verifyOwnWitness(remote(db, A), a, `account:${A}`);
    const conflicts = await db.query("select candidate from circle_private.writing_conflicts");
    assert.equal(conflicts.rows.length, 2);
    assert.ok(conflicts.rows.every(row => row.candidate === null));
    await assert.rejects(runHostedChecks({ owner: `account:${A}`, remote: remote(db, A), witness: a }), /already has/);
    await assert.rejects(verifyOwnWitness(remote(db, B), a, `account:${B}`), /original account/);
  } finally { await db.close(); }
});

test("witness input cannot select unrelated records or contain credentials", () => {
  for (const invalid of [null, {}, { entryId: "personal-entry" }, { access_token: "never accepted" }]) {
    assert.throws(() => validateWitness(invalid), /Invalid test witness/);
  }
});

test("service-role probe is local development only and distinguishes denial from connection failure", async () => {
  const previous = { mode: process.env.NODE_ENV, url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY, fetch: globalThis.fetch };
  const request = (origin = "http://localhost:3000") => new Request("http://localhost:3000/os/sync-check/service-role",
    { method: "POST", headers: { Origin: origin } });
  try {
    process.env.NODE_ENV = "production";
    assert.equal((await POST(request())).status, 404);
    process.env.NODE_ENV = "development";
    assert.equal((await POST(request("https://elsewhere.test"))).status, 404);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://gcqmblrkpfvjnewzdycj.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "synthetic-server-only-key";
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options }); return Response.json({ code: "42501" }, { status: 403 });
    };
    const response = await POST(request());
    assert.deepEqual(await response.json(), { passed: true });
    assert.equal(calls.length, 3);
    assert.ok(calls.every(call => call.url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL)
      && call.options.headers.apikey === "synthetic-server-only-key"));
    globalThis.fetch = async () => Response.json({ code: "INVALID_KEY" }, { status: 401 });
    const invalid = await POST(request());
    assert.equal(invalid.status, 502);
    assert.deepEqual(await invalid.json(), { passed: false, stage: "inventory", status: 401, code: "INVALID_KEY" });
    globalThis.fetch = async () => { throw new Error("Never expose a network error body or secret"); };
    const failed = await POST(request());
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { passed: false, networkError: true });
  } finally {
    for (const [name, value] of [["NODE_ENV", previous.mode], ["NEXT_PUBLIC_SUPABASE_URL", previous.url], ["SUPABASE_SECRET_KEY", previous.key]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    globalThis.fetch = previous.fetch;
  }
});
