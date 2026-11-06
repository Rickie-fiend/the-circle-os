import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { A, B, database, remote } from "./helpers/writing-cloud.mjs";

const target = "https://gcqmblrkpfvjnewzdycj.supabase.co";
const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
import { SyncCheckClient } from "/app/os/sync-check/sync-check-client.tsx";
import { SupabaseConnection } from "/app/os/auth/supabase-context.tsx";
import * as scope from "/app/os/account-scope.js";
import * as recovery from "/app/os/sync-check/durable-checks.ts";
let account=sessionStorage.getItem("fixture-account")||"${A}";
scope.activateAccountScope(account);
const client={auth:{getSession:async()=>({data:{session:{user:{id:account},access_token:"fixture-"+account}},error:null}),
 getUser:async()=>({data:{user:{id:account,email_confirmed_at:"2026-11-06T00:00:00.000Z"}},error:null})}};
const connection={client,config:{url:"${target}",key:"synthetic-public-key"}};
window.checks={read:()=>recovery.readRecoveryRun(scope.getAccountScope()),
 select(id){account=id;sessionStorage.setItem("fixture-account",id);scope.activateAccountScope(id);},
 async abortRead(id){const old=scope.getAccountScope(),pending=recovery.readRecoveryRun(old);this.select(id);
   try{await pending;return "unexpected old result";}catch(error){return error.message;}}
};
createRoot(document.getElementById("root")).render(React.createElement(SupabaseConnection.Provider,{value:connection},React.createElement(SyncCheckClient)));
`;
let db, browser, vite, baseURL;
before(async () => {
  db = await database();
  vite = await createServer({ configFile: false, define: { "process.env.NEXT_PUBLIC_CIRCLE_WRITING_SYNC": JSON.stringify("disabled") },
    plugins: [react(), { name: "durable-hosted-check-fixture",
      resolveId: id => id === "virtual:recovery-test" ? "\0recovery-test" : null,
      load: id => id === "\0recovery-test" ? harness : null,
      configureServer(server) { server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/__recovery") return next();
        res.setHeader("Content-Type", "text/html");
        res.end(await server.transformIndexHtml(req.url, '<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script type="module" src="/@id/virtual:recovery-test"></script>'));
      }); },
    }], optimizeDeps: { include: ["react", "react-dom/client"] },
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**", "**/dist/**"] } },
  });
  await vite.listen(); baseURL = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await vite?.close(); await db?.close(); });
async function device(width = 390) {
  await db.exec("truncate circle_private.writing_heads,circle_private.writing_receipts,circle_private.writing_conflicts,circle_private.writing_resolutions");
  const context = await browser.newContext({ viewport: { width, height: 844 }, timezoneId: "Asia/Bangkok", isMobile: true, hasTouch: true });
  const calls = [], loss = { apply: false, resolve: false }, errors = [];
  let hold = null;
  await context.route("**/*", async route => {
    const request = route.request(), url = request.url();
    if (url.startsWith(baseURL)) return route.continue();
    if (!url.startsWith(`${target}/rest/v1/rpc/`)) return route.abort();
    const account = [A, B].find(id => request.headers().authorization === `Bearer fixture-${id}`);
    if (!account) return route.fulfill({ status: 401, json: { code: "42501" } });
    const body = request.postDataJSON(), name = url.split("/").at(-1), api = remote(db, account);
    calls.push({ name, body, account });
    try {
      const result = name === "circle_writing_apply" ? await api.apply(body.request)
        : name === "circle_writing_resolve" ? await api.resolve(body.request)
        : name === "circle_writing_inventory" ? await api.inventory(body.after_id)
        : name === "circle_writing_receipts" ? await api.receipts(body.operation_ids) : await api.resolutions(body.after_id);
      if (hold && name === "circle_writing_apply") { const waiting = hold; hold = null; waiting.accepted(); await waiting.release; }
      const key = name === "circle_writing_apply" ? "apply" : name === "circle_writing_resolve" ? "resolve" : null;
      if (key && loss[key]) { loss[key] = false; return route.abort("failed"); }
      await route.fulfill({ json: result });
    } catch { await route.fulfill({ status: 400, json: { code: "SYNTHETIC_RPC_ERROR" } }).catch(() => {}); }
  });
  const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${baseURL}/__recovery`); await ready(page);
  return { page, context, calls, loss, errors, holdApply() {
    let accepted, release;
    const acceptedPromise = new Promise(resolve => { accepted = resolve; });
    const releasePromise = new Promise(resolve => { release = resolve; });
    hold = { accepted, release: releasePromise }; return { accepted: acceptedPromise, release };
  } };
}
async function ready(page) {
  await page.waitForFunction(() => window.checks);
  await expect(page.getByTestId("recovery-phase")).not.toHaveText("Checkpoint: loading");
}
async function reload(page, phase) {
  await page.reload(); await ready(page);
  await expect(page.getByTestId("recovery-phase")).toHaveText(`Checkpoint: ${phase}`);
}
async function advance(page, phase) {
  await page.getByRole("button", { name: "Continue after reload", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reload recovery page", exact: true })).toBeEnabled({ timeout: 30000 });
  assert.equal(await page.getByTestId("recovery-phase").textContent(), `Checkpoint: ${phase}`,
    (await page.getByRole("status").allTextContents()).join("; "));
}
const read = page => page.evaluate(() => window.checks.read());
const phases = ["offline-saved", "upload-reply-lost", "choice-queued", "choice-reply-lost", "delete-queued", "complete"];

for (const width of [360, 390]) test(`durable hosted harness reloads saves, choices and deletion at ${width}px`, { timeout: 120000 }, async () => {
  const d = await device(width);
  try {
    // Sentinel lives in the product DB name; the test store must never alter it.
    await d.page.evaluate(async id => {
      await new Promise((resolve, reject) => {
        const open = indexedDB.open(`circle-os-writing-v1:account:${id}`, 1);
        open.onupgradeneeded = () => open.result.createObjectStore("writing");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => { const db = open.result, tx = db.transaction("writing", "readwrite");
          tx.objectStore("writing").put("synthetic product-store sentinel", "sentinel");
          tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
      });
    }, A);
    await d.context.setOffline(true);
    await d.page.getByRole("button", { name: "Start reload checks", exact: true }).click();
    await expect(d.page.getByTestId("recovery-phase")).toHaveText("Checkpoint: offline-saved");
    const initial = await read(d.page); assert.equal(d.calls.length, 0);
    await d.page.getByRole("button", { name: "Continue after reload", exact: true }).click();
    await expect(d.page.getByRole("status")).toContainText("Reload this page"); assert.equal(d.calls.length, 0);
    await d.context.setOffline(false);
    let requestId;
    for (let index = 0; index < phases.length - 1; index++) {
      await reload(d.page, phases[index]);
      const before = await read(d.page);
      assert.equal(before.entryId, initial.entryId);
      if (index === 0) assert.equal(before.upload.requestId, initial.upload.requestId);
      if (phases[index] === "choice-queued") requestId = before.choice.requestId;
      if (phases[index] === "choice-reply-lost") assert.equal(before.choice.requestId, requestId);
      await advance(d.page, phases[index + 1]);
      if (index === 0) {
        const pending = await read(d.page); assert.equal(Object.keys(pending.devices.one.queue.pending).length, 1);
        assert.equal((await remote(db, A).inventory(""))[0].serverVersion, 1);
      }
    }
    const complete = await read(d.page);
    assert.equal(JSON.stringify(complete).includes("Synthetic reload"), false);
    assert.equal(complete.checks.length, 6);
    for (const bundle of Object.values(complete.devices)) {
      assert.equal(Object.keys(bundle.state.entries).length, 0); assert.equal(Object.keys(bundle.queue.pending).length, 0);
      assert.equal(Object.keys(bundle.cloud.resolved || {}).length, 0);
    }
    const archives = (await db.query("select request_body,result_head from circle_private.writing_resolutions")).rows;
    assert.equal(archives.length, 2); assert.ok(archives.every(r => r.request_body === null && r.result_head === null));
    assert.equal((await remote(db, A).inventory(""))[0].serverVersion, 7);
    assert.equal((await db.query("select count(*)::int as count from circle_private.writing_receipts")).rows[0].count, 5);
    const count = d.calls.length; await reload(d.page, "complete");
    await d.page.getByRole("button", { name: "Check saved completion", exact: true }).click();
    await expect(d.page.getByRole("button", { name: "Check saved completion", exact: true })).toBeEnabled();
    assert.equal(d.calls.length, count, "completion reload does not make requests");
    assert.equal(await d.page.evaluate(async id => new Promise((resolve, reject) => {
      const open = indexedDB.open(`circle-os-writing-v1:account:${id}`);
      open.onsuccess = () => { const db = open.result, tx = db.transaction("writing"), get = tx.objectStore("writing").get("sentinel");
        get.onsuccess = () => resolve(get.result); get.onerror = () => reject(get.error); tx.oncomplete = () => db.close(); };
    }), A), "synthetic product-store sentinel");
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
});

test("accepted HTTP replies lost before checkpoints retry exact uploads and choices after reload", { timeout: 120000 }, async () => {
  const d = await device();
  try {
    await d.page.getByRole("button", { name: "Start reload checks", exact: true }).click();
    await expect(d.page.getByTestId("recovery-phase")).toHaveText("Checkpoint: offline-saved");
    const first = await read(d.page);
    await reload(d.page, "offline-saved"); d.loss.apply = true;
    await d.page.getByRole("button", { name: "Continue after reload", exact: true }).click();
    await expect(d.page.getByRole("status")).toContainText(/fetch|network/i);
    assert.equal((await read(d.page)).upload.requestId, first.upload.requestId);
    assert.equal((await remote(db, A).inventory(""))[0].serverVersion, 1);
    await reload(d.page, "offline-saved"); await advance(d.page, "upload-reply-lost");
    assert.equal((await remote(db, A).inventory(""))[0].serverVersion, 1, "exact retry does not add a revision");
    await reload(d.page, "upload-reply-lost"); await advance(d.page, "choice-queued");
    const chosen = (await read(d.page)).choice;
    await reload(d.page, "choice-queued"); d.loss.resolve = true;
    await d.page.getByRole("button", { name: "Continue after reload", exact: true }).click();
    await expect(d.page.getByRole("status")).toContainText(/fetch|network/i);
    assert.equal((await read(d.page)).choice.requestId, chosen.requestId);
    await reload(d.page, "choice-queued"); await advance(d.page, "choice-reply-lost");
    assert.equal((await db.query("select count(*)::int as count from circle_private.writing_resolutions")).rows[0].count, 1);
    await reload(d.page, "choice-reply-lost"); await advance(d.page, "delete-queued");
    await reload(d.page, "delete-queued"); await advance(d.page, "complete");
    assert.equal(JSON.stringify(await read(d.page)).includes("Synthetic reload"), false);
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
});

test("account checkpoints stay separate and a late old-account reply cannot advance them", { timeout: 120000 }, async () => {
  const d = await device();
  try {
    await d.page.getByRole("button", { name: "Start reload checks", exact: true }).click();
    await expect(d.page.getByTestId("recovery-phase")).toHaveText("Checkpoint: offline-saved");
    const a = await read(d.page); await reload(d.page, "offline-saved");
    const held = d.holdApply();
    await d.page.getByRole("button", { name: "Continue after reload", exact: true }).click(); await held.accepted;
    await d.page.evaluate(id => window.checks.select(id), B); held.release();
    await expect(d.page.getByTestId("recovery-phase")).toHaveText("Checkpoint: not started");
    await expect(d.page.getByRole("button", { name: "Start reload checks", exact: true })).toBeEnabled();
    assert.equal(await read(d.page), null);
    await d.page.getByRole("button", { name: "Start reload checks", exact: true }).click();
    await expect(d.page.getByTestId("recovery-phase")).toHaveText("Checkpoint: offline-saved");
    const b = await read(d.page); assert.notEqual(a.entryId, b.entryId); assert.equal(b.owner, `account:${B}`);
    const error = await d.page.evaluate(id => window.checks.abortRead(id), A); assert.match(error, /account changed/i);
    await expect(d.page.getByTestId("recovery-entry")).toHaveText(a.entryId);
    assert.equal((await read(d.page)).phase, "offline-saved", "late A response cannot checkpoint after switch");
    assert.equal((await read(d.page)).upload.requestId, a.upload.requestId);
    await reload(d.page, "offline-saved"); await advance(d.page, "upload-reply-lost");
    assert.equal((await remote(db, A).inventory(""))[0].serverVersion, 1);
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
});
