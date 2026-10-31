import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, expect } from "@playwright/test";

const origin = process.env.CIRCLE_TEST_ORIGIN || "http://127.0.0.1:3222";
const productionOrigin = process.env.CIRCLE_PRODUCTION_TEST_MODE_ORIGIN;
const realMarker = JSON.stringify({ kind: "account", accountId: "synthetic-real-account", epoch: "synthetic-original-epoch" });
const testMarkerKey = "circle-os-development-test-scope-v1";
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function isolated(width, base, work) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, timezoneId: "Asia/Bangkok" });
  const errors = []; const external = [];
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === base) return route.continue();
    external.push(new URL(route.request().url()).origin); return route.abort();
  });
  await context.addInitScript(({ realMarker, base }) => {
    if (location.origin !== base) return;
    if (sessionStorage.getItem("synthetic-test-mode-seeded")) return;
    localStorage.setItem("circle-os-account-scope-v1", realMarker);
    localStorage.setItem("circle-os-state-v2", "synthetic legacy bytes");
    localStorage.setItem("circle-os-state-v2:account:synthetic-real-account", "synthetic real-account bytes");
    localStorage.setItem("circle-os-auth:synthetic-real-project:offline", "synthetic auth bytes");
    sessionStorage.setItem("synthetic-test-mode-seeded", "yes");
  }, { realMarker, base });
  try {
    const page = await context.newPage(); await page.goto(`${base}/os`, { waitUntil: "domcontentloaded" });
    await work(page);
    assert.deepEqual(errors, [], "no page errors");
    assert.deepEqual(external, [], "test mode does not contact auth or the legacy profile server");
    assert.deepEqual(await page.evaluate(() => [
      localStorage.getItem("circle-os-account-scope-v1"),
      localStorage.getItem("circle-os-state-v2"),
      localStorage.getItem("circle-os-state-v2:account:synthetic-real-account"),
      localStorage.getItem("circle-os-auth:synthetic-real-project:offline"),
    ]), [realMarker, "synthetic legacy bytes", "synthetic real-account bytes", "synthetic auth bytes"]);
  } finally { await context.close(); }
}
async function snapshot(page) {
  return page.evaluate(key => {
    const scope = JSON.parse(localStorage.getItem(key));
    const record = JSON.parse(localStorage.getItem(`circle-os-state-v2:account:${scope.accountId}`) || "null");
    return { scope, state: record?.state };
  }, testMarkerKey);
}
for (const width of [390, 360]) {
  test(`development mode: fresh Day One, saved resume and new empty session at ${width}px`, { timeout: 120_000 }, async () => isolated(width, origin, async page => {
    const session = page.locator(".os-day-one-session");
    await expect(session.getByRole("heading", { name: "Start with what matters." })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: "New test session" })).toBeVisible();
    assert.equal(await page.getByLabel("Email", { exact: true }).count(), 0);
    await expect.poll(async () => Boolean((await snapshot(page)).state)).toBe(true);
    const first = await snapshot(page);
    assert.match(first.scope.accountId, /^dev-test-/);
    assert.equal(first.state.profile.name, ""); assert.equal(first.state.profile.age, null);
    await session.getByRole("button", { name: /^Begin / }).click();
    const priority = session.getByRole("textbox", { name: "What matters most to you right now?", exact: true });
    await expect(priority).toBeVisible(); await priority.fill("Synthetic first priority");
    await session.getByRole("button", { name: "Continue", exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).state?.chapters.runs["day-one@3"]?.currentPageId).toBe("direction");
    const firstBytes = await page.evaluate(id => localStorage.getItem(`circle-os-state-v2:account:${id}`), first.scope.accountId);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(session.getByRole("textbox", { name: "What would you like to be different?", exact: true })).toBeVisible();
    assert.equal((await snapshot(page)).scope.accountId, first.scope.accountId);
    await page.getByRole("button", { name: "New test session" }).click();
    await expect(session.getByRole("heading", { name: "Start with what matters." })).toBeVisible();
    await expect.poll(async () => { const next = await snapshot(page); return next.scope.accountId !== first.scope.accountId && Boolean(next.state); }).toBe(true);
    const second = await snapshot(page); assert.notEqual(second.scope.accountId, first.scope.accountId);
    assert.equal(second.state.chapters.runs["day-one@3"], undefined);
    assert.equal(second.state.profile.name, ""); assert.equal(second.state.profile.age, null);
    // The previous synthetic run remains under its old owner; reset deletes nothing.
    const retained = await page.evaluate(id => localStorage.getItem(`circle-os-state-v2:account:${id}`), first.scope.accountId);
    assert.ok(JSON.parse(retained).state.chapters.runs["day-one@3"]);
    assert.ok(firstBytes.includes("Synthetic first priority"));
    await session.getByRole("button", { name: /^Begin / }).click();
    await expect(priority).toHaveValue("");
  }));
}
test("a production build with test mode configured stays locked", { timeout: 60_000, skip: !productionOrigin }, async () => isolated(360, productionOrigin, async page => {
  await expect(page.getByRole("heading", { name: "Sign-in is not ready." })).toBeVisible();
  assert.equal(await page.getByRole("button", { name: "New test session" }).count(), 0);
  assert.equal(await page.locator(".os-day-one-session").count(), 0);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), testMarkerKey), null);
}));
