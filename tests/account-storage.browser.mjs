import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";

// Test-only Vite page imports the actual store, sync client and React provider.
// No production route, auth bypass or account-switch control is added to the app.
const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
import * as scopes from "/app/os/account-scope.js";
import * as store from "/app/os/circle-os-store.ts";
import * as publications from "/app/os/chapters/chapter-publication-store.ts";
import * as pins from "/app/os/day-door.js";
import * as client from "/app/os/circle-os-ai.ts";
import { createEmptyState } from "/app/os/circle-os-model.js";
import { CircleStateProvider, useCircleState } from "/app/os/circle-os-shell.tsx";
import { useChapterPublications } from "/app/os/chapters/use-chapter-publications.ts";

function Probe() {
  const { state, ready, updateProfile } = useCircleState();
  const { publications: chapters } = useChapterPublications(ready);
  window.currentActions = { updateProfile };
  return React.createElement("section", { "data-testid": "probe", "data-ready": String(ready) },
    React.createElement("div", { "data-testid": "name" }, ready ? state.profile.name : "opening"),
    React.createElement("div", { "data-testid": "private" }, chapters.filter(c => c.visibility === "private").map(c => c.chapter.title).join("|")),
    React.createElement("input", { "aria-label": "Unsaved writing", defaultValue: "" }));
}
const root = createRoot(document.getElementById("root"));
window.api = { ...scopes, ...store, ...publications, ...pins, ...client,
  fixture(name) { const state = createEmptyState(); state.profile.name = name; state.profile.age = 30; state.ai.baseUrl = ""; return state; },
  publication(title) { return { chapter: { id: "synthetic-private", version: 1, title }, source: "admin", publishedAt: "2026-10-31T00:00:00Z", visibility: "private" }; },
  mount() { root.render(React.createElement(CircleStateProvider, null, React.createElement(Probe))); },
};
`;

let server;
let browser;
let baseURL;
before(async () => {
  server = await createServer({
    configFile: false,
    define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
    plugins: [react(), {
      name: "account-storage-test",
      resolveId(id) { if (id === "virtual:account-storage-test") return "\0account-storage-test.tsx"; },
      load(id) { if (id === "\0account-storage-test.tsx") return harness; },
      configureServer(vite) {
        vite.middlewares.use("/__account-storage-test", async (_request, response, next) => {
          try {
            const html = await vite.transformIndexHtml("/__account-storage-test", '<div id="root"></div><script type="module" src="/@id/virtual:account-storage-test"></script>');
            response.setHeader("Content-Type", "text/html"); response.end(html);
          } catch (error) { next(error); }
        });
      },
    }],
    server: { host: "127.0.0.1", port: 3220, strictPort: true, watch: { ignored: ["**/.next/**", "**/dist/**"] } },
    optimizeDeps: { include: ["react", "react-dom/client", "next/link", "next/navigation"] },
  });
  await server.listen();
  baseURL = "http://127.0.0.1:3220";
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server?.close(); });

async function isolated(width, work) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const errors = [];
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  await context.route("**/*", route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
  try {
    const page = await context.newPage();
    await open(page);
    await work(page, context);
    assert.deepEqual(errors, [], "no page errors");
  } finally { await context.close(); }
}

async function open(page) {
  await page.goto(`${baseURL}/__account-storage-test`);
  await page.waitForFunction(() => Boolean(window.api));
}

async function ready(page, name) {
  await expect(page.getByTestId("probe")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("name")).toHaveText(name);
}

for (const width of [390, 360]) {
  test(`stores, private chapters and pins stay separate across switching, logout and reload at ${width}px`, { timeout: 120_000 }, async () => isolated(width, async page => {
    await page.evaluate(async () => {
      const a = window.api; const scope = a.getAccountScope();
      await a.saveCircleState(scope, a.fixture("Legacy owner"));
      await a.writeImmutableChapterPublication(scope, a.publication("Legacy chapter"));
      a.writePinnedDoor("week-review");
    });
    await page.evaluate(() => window.api.mount());
    await ready(page, "Legacy owner");
    await expect(page.getByTestId("private")).toHaveText("Legacy chapter");
    await page.getByRole("textbox").fill("unsaved legacy writing");
    const legacyBytes = await page.evaluate(() => localStorage.getItem("circle-os-state-v2"));

    await page.evaluate(() => window.api.activateAccountScope("synthetic-a"));
    await ready(page, "");
    await expect(page.getByRole("textbox")).toHaveValue("");
    await expect(page.getByTestId("private")).toHaveText("");
    assert.equal(await page.evaluate(() => window.api.readPinnedDoor()), null);
    await page.evaluate(async () => {
      const a = window.api; const scope = a.getAccountScope();
      await a.writeImmutableChapterPublication(scope, a.publication("A chapter"));
      a.announceChapterPublication(); a.writePinnedChapter("a-chapter");
      window.currentActions.updateProfile(profile => ({ ...profile, name: "Account A" }));
    });
    await ready(page, "Account A");
    await expect(page.getByTestId("private")).toHaveText("A chapter");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2:account:synthetic-a")).state.profile.name)).toBe("Account A");

    await page.evaluate(() => window.api.activateAccountScope("synthetic-b"));
    await ready(page, "");
    await expect(page.getByTestId("private")).toHaveText("");
    await page.evaluate(() => window.currentActions.updateProfile(profile => ({ ...profile, name: "Account B" })));
    await ready(page, "Account B");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2:account:synthetic-b")).state.profile.name)).toBe("Account B");
    await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    await page.evaluate(() => window.api.mount()); await ready(page, "Account B");

    await page.evaluate(() => window.api.activateAccountScope(null));
    await expect(page.getByTestId("probe")).toHaveCount(0);
    assert.equal(await page.evaluate(async () => {
      try { await window.api.loadCircleState(window.api.getAccountScope()); return false; } catch { return true; }
    }), true);
    await page.reload(); await page.waitForFunction(() => Boolean(window.api));
    await page.evaluate(() => window.api.mount());
    await expect(page.getByTestId("probe")).toHaveCount(0);
    await page.evaluate(() => window.api.activateAccountScope("synthetic-a"));
    await ready(page, "Account A");
    await expect(page.getByTestId("private")).toHaveText("A chapter");
    assert.equal(await page.evaluate(() => window.api.readPinnedDoor()), "chapter:a-chapter");
    assert.equal(await page.evaluate(() => localStorage.getItem("circle-os-state-v2")), legacyBytes);
  }));
}

test("cross-tab switch and logout remove old forms and deny stale callbacks", { timeout: 120_000 }, async () => isolated(390, async (page, context) => {
  await page.evaluate(async () => {
    const a = window.api; const scope = a.activateAccountScope("synthetic-a");
    await a.saveCircleState(scope, a.fixture("Account A")); a.mount();
  });
  await ready(page, "Account A");
  await page.getByRole("textbox").fill("unsaved A writing");
  await page.evaluate(() => { window.oldUpdate = window.currentActions.updateProfile; });
  const other = await context.newPage(); await open(other);
  await other.evaluate(() => { window.api.activateAccountScope("synthetic-b"); window.api.mount(); });
  await ready(other, ""); await ready(page, "");
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.evaluate(() => window.oldUpdate(profile => ({ ...profile, name: "stale A" })));
  await ready(page, "");
  await other.evaluate(() => window.api.activateAccountScope(null));
  await expect(page.getByTestId("probe")).toHaveCount(0);
  await expect(other.getByTestId("probe")).toHaveCount(0);
}));

test("queued saves and delayed reads cannot escape their captured account", { timeout: 120_000 }, async () => isolated(390, async page => {
  const result = await page.evaluate(async () => {
    const a = window.api; const old = a.activateAccountScope("synthetic-a");
    const read = a.loadCircleState(old).then(() => "resolved", () => "rejected");
    const write = a.saveCircleState(old, a.fixture("A queued")).then(() => "resolved", () => "rejected");
    const chapters = a.writeImmutableChapterPublication(old, a.publication("stale chapter")).then(() => "resolved", () => "rejected");
    const b = a.activateAccountScope("synthetic-b");
    const outcomes = await Promise.all([read, write, chapters]);
    return { outcomes, name: (await a.loadCircleState(b)).profile.name, chapters: await a.readChapterPublications(b), pin: a.readPinnedDoor(old) };
  });
  assert.deepEqual(result, { outcomes: ["rejected", "rejected", "rejected"], name: "", chapters: [], pin: null });
}));

test("late legacy network responses are rejected and account mode cannot contact the profile server", { timeout: 120_000 }, async () => isolated(390, async page => {
  const result = await page.evaluate(async () => {
    const a = window.api; const legacy = a.getAccountScope();
    const state = a.fixture("Legacy"); state.ai.baseUrl = location.origin; state.ai.profileId = "p_synthetic"; state.ai.token = "synthetic-test-token";
    const originalFetch = window.fetch; let finish; let sentSignal; let requests = 0;
    window.fetch = async (_url, options) => { requests++; sentSignal = options.signal; return await new Promise(resolve => { finish = resolve; }); };
    try {
      const pending = a.syncCircleState(state, legacy).then(() => "resolved", () => "rejected");
      const account = a.activateAccountScope("synthetic-a");
      finish(new Response(JSON.stringify({ state, profileId: state.ai.profileId }), { status: 200 }));
      const late = await pending;
      const denied = await a.syncCircleState(state, account).then(() => false, () => true);
      return { late, denied, aborted: sentSignal.aborted, requests };
    } finally { window.fetch = originalFetch; }
  });
  assert.deepEqual(result, { late: "rejected", denied: true, aborted: true, requests: 1 });
}));

test("private chapter versions remain immutable within each account", { timeout: 120_000 }, async () => isolated(390, async page => {
  assert.deepEqual(await page.evaluate(async () => {
    const a = window.api; const scope = a.activateAccountScope("synthetic-a");
    await a.writeImmutableChapterPublication(scope, a.publication("original"));
    const refused = await a.writeImmutableChapterPublication(scope, a.publication("edited")).then(() => false, () => true);
    return { refused, titles: (await a.readChapterPublications(scope)).map(p => p.chapter.title) };
  }), { refused: true, titles: ["original"] });
}));

test("newest local copy and IndexedDB fallback stay within the account", { timeout: 120_000 }, async () => isolated(390, async page => {
  const result = await page.evaluate(async () => {
    const a = window.api; const scope = a.activateAccountScope("synthetic-a");
    await a.saveCircleState(scope, a.fixture("Indexed copy"));
    const key = a.accountStorageKey(scope, "circle-os-state-v2");
    localStorage.setItem("circle-os-state-v1", JSON.stringify(a.fixture("unclaimed legacy")));
    localStorage.setItem(key, JSON.stringify({ savedAt: "2099-01-01T00:00:00Z", state: a.fixture("Newer local") }));
    const newer = (await a.loadCircleState(scope)).profile.name;
    localStorage.setItem(key, "invalid JSON");
    const fallback = (await a.loadCircleState(scope)).profile.name;
    localStorage.removeItem(key);
    const indexed = (await a.loadCircleState(scope)).profile.name;
    const b = a.activateAccountScope("synthetic-b");
    return { newer, fallback, indexed, b: (await a.loadCircleState(b)).profile.name };
  });
  assert.deepEqual(result, { newer: "Newer local", fallback: "Indexed copy", indexed: "Indexed copy", b: "" });
}));

test("aborting a live IndexedDB transaction rejects it and preserves its previous value", { timeout: 120_000 }, async () => isolated(390, async page => {
  assert.deepEqual(await page.evaluate(async () => {
    const a = window.api; const scope = a.activateAccountScope("synthetic-a");
    await a.saveCircleState(scope, a.fixture("Durable A"));
    const outcome = await a.scopedTransaction(scope, "circle-os", "state", "readwrite", () => {}, (store, result) => {
      store.put({ savedAt: "2099-01-01T00:00:00Z", state: a.fixture("aborted edit") }, "circle-os-state-v2").onsuccess = () => {
        a.activateAccountScope("synthetic-b"); result("unexpected commit");
      };
    }).then(() => "resolved", () => "rejected");
    const again = a.activateAccountScope("synthetic-a");
    localStorage.removeItem(a.accountStorageKey(again, "circle-os-state-v2"));
    return { outcome, name: (await a.loadCircleState(again)).profile.name };
  }), { outcome: "rejected", name: "Durable A" });
}));

test("offline edits and clearing saves survive a reload without loading another account", { timeout: 120_000 }, async () => isolated(390, async (page, context) => {
  await page.evaluate(async () => {
    const a = window.api; const scope = a.activateAccountScope("synthetic-a");
    await a.saveCircleState(scope, a.fixture("Account A")); a.mount();
  });
  await ready(page, "Account A");
  await context.setOffline(true);
  await page.evaluate(() => window.currentActions.updateProfile(profile => ({ ...profile, name: "Offline edit" })));
  await ready(page, "Offline edit");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2:account:synthetic-a")).state.profile.name)).toBe("Offline edit");
  await page.evaluate(() => window.currentActions.updateProfile(profile => ({ ...profile, name: "" })));
  await ready(page, "");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2:account:synthetic-a")).state.profile.name)).toBe("");
  await context.setOffline(false);
  await page.reload(); await page.waitForFunction(() => Boolean(window.api));
  await page.evaluate(() => window.api.mount()); await ready(page, "");
  await page.evaluate(() => window.api.activateAccountScope("synthetic-b")); await ready(page, "");
}));

test("a second tab signing out during a save invalidates that work", { timeout: 120_000 }, async () => isolated(390, async (page, context) => {
  await page.evaluate(() => window.api.activateAccountScope("synthetic-a"));
  const other = await context.newPage(); await open(other);
  await page.evaluate(() => {
    const a = window.api; const scope = a.getAccountScope();
    window.pendingOutcome = a.scopedTransaction(scope, "synthetic-delayed", "state", "readwrite", db => db.createObjectStore("state"), (store, result) => {
      function keepAlive() { store.get("key").onsuccess = () => { result("unexpected commit"); keepAlive(); }; }
      keepAlive();
    }).then(() => "resolved", () => "rejected");
  });
  await other.evaluate(() => window.api.activateAccountScope(null));
  assert.equal(await page.evaluate(() => window.pendingOutcome), "rejected");
}));

test("a delayed legacy startup cannot repopulate the provider after switching", { timeout: 120_000 }, async () => isolated(390, async page => {
  await page.evaluate(async () => {
    const a = window.api; const state = a.fixture("Legacy startup");
    state.ai.baseUrl = location.origin; state.ai.profileId = "p_synthetic"; state.ai.token = "synthetic-test-token";
    await a.saveCircleState(a.getAccountScope(), state);
    window.originalFetch = window.fetch;
    window.fetch = async () => await new Promise(resolve => { window.finishStartup = () => resolve(new Response(JSON.stringify({ state }), { status: 200 })); });
    a.mount();
  });
  await page.waitForFunction(() => Boolean(window.finishStartup));
  await page.evaluate(() => window.api.activateAccountScope("synthetic-a"));
  await ready(page, "");
  await page.evaluate(() => { window.finishStartup(); window.fetch = window.originalFetch; });
  await ready(page, "");
  await expect(page.getByTestId("private")).toHaveText("");
}));
