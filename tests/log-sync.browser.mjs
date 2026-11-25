import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { createEmptyState, CIRCLE_OS_STORAGE_KEY } from "../app/os/circle-os-model.js";
import { chapterRunId, createChapterRun } from "../app/os/chapters/chapter-model.js";

function testZones() {
  const zones = ["Pacific/Pago_Pago", "Pacific/Honolulu", "America/Los_Angeles", "America/Chicago",
    "America/New_York", "America/Sao_Paulo", "UTC", "Europe/Athens", "Asia/Dubai", "Asia/Dhaka",
    "Asia/Bangkok", "Asia/Tokyo", "Australia/Brisbane", "Pacific/Auckland", "Pacific/Kiritimati"];
  const now = new Date();
  const clocks = zones.map(zone => {
    const local = new Date(new Intl.DateTimeFormat("sv-SE", { timeZone: zone, dateStyle: "short", timeStyle: "medium" })
      .format(now).replace(" ", "T") + "Z");
    const hour = local.getUTCHours();
    local.setUTCHours(hour - 6);
    return { zone, hour, day: local.toISOString().slice(0, 10) };
  });
  const early = clocks.find(clock => clock.hour < 6);
  const later = early && clocks.find(clock => clock.day > early.day);
  assert.ok(early && later, "two zones with different Circle days");
  return { early, later };
}

export async function verifyLocalLogSync({ appOrigin, supabaseOrigin, owner, other }) {
  assert.match(supabaseOrigin, /^http:\/\/127\.0\.0\.1:\d+$/);
  await verifyLogSync({ appOrigin, supabaseOrigin, owner, other });
}

export async function verifyHostedLogSync({ appOrigin, supabaseOrigin, confirmedTestOrigin, owner, other }) {
  assert.match(supabaseOrigin, /^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
  assert.equal(supabaseOrigin, confirmedTestOrigin, "the hosted project must be explicitly confirmed");
  await verifyLogSync({ appOrigin, supabaseOrigin, owner, other });
}

async function verifyLogSync({ appOrigin, supabaseOrigin, owner, other }) {
  assert.match(appOrigin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const { early, later } = testZones();
  const endpoint = appOrigin + "/os/log-sync";
  const exchange = (token, account, operation = null) => fetch(endpoint, {
    method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ owner: account, operation }), signal: AbortSignal.timeout(15000),
  });
  async function inventory(account = owner) {
    const response = await exchange(account.token, account.id);
    assert.equal(response.status, 200);
    return response.json();
  }
  const browser = await chromium.launch();
  try {
    const seed = createEmptyState();
    const { chapters } = JSON.parse(await readFile(new URL("../app/os/chapters/published/index.json", import.meta.url), "utf8"));
    for (const chapter of chapters) {
      const run = createChapterRun(chapter);
      seed.chapters.runs[chapterRunId(chapter)] = { ...run, status: "completed", completedAt: new Date().toISOString() };
    }
    async function profile() {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: early.zone,
        reducedMotion: "reduce", serviceWorkers: "block" });
      await context.route("**/*", route => [appOrigin, supabaseOrigin].includes(new URL(route.request().url()).origin)
        ? route.continue() : route.abort());
      await context.addInitScript(({ origin, storageKey, seed }) => {
        if (location.origin === origin && !localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, JSON.stringify({ state: seed, savedAt: new Date().toISOString() }));
        }
      }, { origin: appOrigin, storageKey: CIRCLE_OS_STORAGE_KEY + ":account:" + owner.id, seed });
      const page = await context.newPage();
      page.setDefaultTimeout(18000);
      await page.goto(appOrigin + "/os");
      await page.getByLabel("Email", { exact: true }).fill(owner.email);
      await page.getByLabel("Password", { exact: true }).fill(owner.password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      const alias = page.getByRole("textbox", { name: "Alias", exact: true });
      const launch = page.getByRole("button", { name: "Log", exact: true });
      await expect(alias.or(launch).first()).toBeVisible({ timeout: 20000 });
      if (await alias.isVisible()) {
        await alias.fill("Log Rehearsal");
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await expect(launch).toBeVisible({ timeout: 20000 });
      }
      return { context, page };
    }
    const one = await profile(), two = await profile();
    const log = ({ page }) => page.locator(".os-log-session");
    async function openLog(profile) {
      const launch = profile.page.getByRole("button", { name: "Log", exact: true });
      const history = log(profile).getByRole("button", { name: "History", exact: true });
      await expect(launch.or(history).first()).toBeVisible({ timeout: 20000 });
      if (!await history.isVisible()) await launch.click();
      await expect(history).toBeVisible();
    }
    const slot = (profile, index) => log(profile).locator(".os-timeline article").nth(index);
    async function create(profile, index, words) {
      const row = slot(profile, index);
      await row.getByRole("button", { name: /^Add a small moment/ }).click();
      await row.getByRole("textbox", { name: /^Main activity/ }).fill(words);
      await row.getByRole("button", { name: "Save main activity" }).click();
      await expect(row.getByRole("button", { name: words, exact: true })).toBeVisible();
    }
    assert.deepEqual(await inventory(), []);
    await openLog(one);
    await openLog(two);
    await expect(slot(one, 0).getByRole("button", { name: /^Add a small moment/ })).toBeVisible();
    await expect(slot(two, 0).getByRole("button", { name: /^Add a small moment/ })).toBeVisible();
    await two.context.setOffline(true);
    await create(two, 0, "Competing offline activity");
    await create(two, 1, "Independent offline activity");
    assert.deepEqual(await inventory(), []);
    await create(one, 0, "Accepted activity");
    const row = slot(one, 0);
    await row.getByRole("button", { name: /^Add a small moment/ }).click();
    await row.getByRole("textbox", { name: /^Small moment/ }).fill("One saved moment");
    await row.getByRole("button", { name: "Save small moment" }).click();
    await expect.poll(async () => (await inventory())[0]?.block.moments, { timeout: 20000 }).toEqual(["One saved moment"]);
    const [original] = await inventory();
    assert.equal(original.dateKey, early.day);
    assert.equal(original.revision, 2);

    let blocked = true, lost, retries = 0, lostChoice, choiceRetries = 0;
    await two.context.route(endpoint, async route => {
      if (blocked) return route.abort();
      const { operation } = route.request().postDataJSON();
      if (operation?.correctionId && operation.block.title === "Competing offline activity") {
        const response = await route.fetch();
        assert.deepEqual(await response.json(), { status: "accepted", revision: 3 });
        choiceRetries++;
        if (!lostChoice) { lostChoice = operation; return route.abort(); }
        assert.deepEqual(operation, lostChoice);
        return route.fulfill({ response });
      }
      if (operation?.block.title !== "Independent offline activity") return route.continue();
      const response = await route.fetch();
      const receipt = await response.json();
      assert.equal(receipt.status, "accepted");
      retries++;
      if (!lost) { lost = operation; return route.abort(); }
      assert.deepEqual(operation, lost);
      return route.fulfill({ response });
    });
    await two.context.setOffline(false);
    await two.page.reload();
    await openLog(two);
    await expect(log(two).getByRole("button", { name: "Independent offline activity" })).toBeVisible();
    blocked = false;
    await expect.poll(() => retries, { timeout: 25000 }).toBe(2);
    await expect(log(one).getByRole("button", { name: "Independent offline activity", exact: true })).toHaveCount(1, { timeout: 20000 });
    await expect(log(two).getByRole("button", { name: "Accepted activity", exact: true })).toBeVisible();
    await log(two).getByRole("button", { name: "History", exact: true }).click();
    await log(two).getByText(/Review Log copies/).click();
    await expect(log(two).getByRole("region", { name: "On this device" })).toContainText("Competing offline activity");
    await expect(log(two).getByRole("region", { name: "Synced entry" })).toContainText("Accepted activity");
    blocked = true;
    await two.context.setOffline(true);
    const useDevice = log(two).getByRole("button", { name: "Use this device’s words" });
    await expect.poll(() => useDevice.evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await useDevice.click();
    await expect(log(two).getByText("Choice saved on this device. Waiting to sync.")).toBeVisible();
    await two.context.setOffline(false);
    await two.page.reload();
    await openLog(two);
    await log(two).getByRole("button", { name: "History", exact: true }).click();
    await log(two).getByText(/Review Log copies/).click();
    await expect(log(two).getByText("Choice saved on this device. Waiting to sync.")).toBeVisible();
    blocked = false;
    await expect.poll(() => choiceRetries, { timeout: 25000 }).toBe(2);
    await log(two).getByText("Saved copies", { exact: true }).click();
    await expect(log(two).getByRole("region", { name: "Synced entry" })).toContainText("Accepted activity");
    await expect(log(two).getByRole("region", { name: "On this device" })).toContainText("Competing offline activity");
    const adopted = (await inventory()).find(head => head.block.id === original.block.id);
    assert.equal(adopted.block.title, "Competing offline activity");
    assert.equal(adopted.corrections[0].before.title, "Accepted activity");
    for (const field of ["start", "end", "createdAt"]) assert.equal(adopted.block[field], original.block[field]);
    assert.equal(adopted.dateKey, original.dateKey);
    await expect(log(one).getByRole("button", { name: "Competing offline activity", exact: true })).toBeVisible({ timeout: 20000 });
    await one.context.setOffline(true);
    await log(one).getByRole("button", { name: "Competing offline activity", exact: true }).click();
    await log(one).getByRole("textbox", { name: /^Main activity/ }).fill("Stale edit to the same entry");
    await log(one).getByRole("button", { name: "Save main activity" }).click();
    await expect(log(one).getByRole("button", { name: "Stale edit to the same entry", exact: true })).toBeVisible();

    const storageState = await two.context.storageState({ indexedDB: true });
    await two.context.close();
    two.context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: later.zone,
      reducedMotion: "reduce", serviceWorkers: "block", storageState });
    await two.context.route("**/*", route => [appOrigin, supabaseOrigin].includes(new URL(route.request().url()).origin)
      ? route.continue() : route.abort());
    two.page = await two.context.newPage();
    two.page.setDefaultTimeout(18000);
    await two.page.goto(appOrigin + "/os");
    await openLog(two);
    await log(two).getByRole("button", { name: "History", exact: true }).click();
    await log(two).locator(".os-log-history-list > button").filter({ hasText: early.day }).click();
    const oldEntry = log(two).getByRole("button", { name: "Edit entry at " + original.block.start, exact: true });
    await oldEntry.click();
    await log(two).getByRole("textbox", { name: "Past activity" }).fill("Corrected activity");
    await log(two).getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(oldEntry).toContainText("Corrected activity");
    await expect.poll(async () => (await inventory()).find(head => head.block.id === original.block.id)?.revision, { timeout: 20000 }).toBe(4);
    const corrected = (await inventory()).find(head => head.block.id === original.block.id);
    assert.equal(corrected.dateKey, original.dateKey);
    for (const field of ["start", "end", "createdAt"]) assert.equal(corrected.block[field], original.block[field]);
    await one.context.setOffline(false);
    await expect(log(one).getByRole("button", { name: "Corrected activity", exact: true })).toBeVisible({ timeout: 20000 });
    await log(one).getByRole("button", { name: "History", exact: true }).click();
    await log(one).getByText(/Review Log copies/).click();
    await expect(log(one).getByRole("region", { name: "On this device" })).toContainText("Stale edit to the same entry");
    await one.context.setOffline(true);
    await log(one).getByRole("button", { name: "Use synced entry" }).click();
    await expect(log(one).getByText("Choice saved on this device. Waiting to sync.")).toBeVisible();
    await oldEntry.click();
    for (const label of ["Past activity", "Past moments"]) await log(two).getByRole("textbox", { name: label }).fill("");
    await log(two).getByRole("button", { name: "Save changes", exact: true }).click();
    await expect.poll(async () => (await inventory()).find(head => head.block.id === original.block.id)?.cleared, { timeout: 20000 }).toBe(true);
    await one.context.setOffline(false);
    await expect(log(one).getByText("The synced entry changed. Review both copies again.")).toBeVisible({ timeout: 20000 });
    await expect(log(one).getByRole("region", { name: "Synced entry" })).toContainText("Entry cleared.");
    await expect(log(one).getByRole("button", { name: "Use this device’s words" })).toHaveCount(0);
    await log(one).getByRole("button", { name: "Use synced entry" }).click();
    await log(one).getByText("Saved copies", { exact: true }).click({ timeout: 20000 });
    await expect(log(one).getByRole("region", { name: "On this device" })).toContainText("Stale edit to the same entry");
    await expect(log(one).getByRole("region", { name: "Synced entry" })).toContainText("Entry cleared.");
    const stale = { id: crypto.randomUUID(), baseRevision: 4, dateKey: original.dateKey, block: corrected.block, cleared: false };
    const replay = await exchange(owner.token, owner.id, stale);
    assert.equal((await replay.json()).head.cleared, true);
    await expect(log(one).getByRole("button", { name: /^(Accepted|Corrected) activity$/ })).toHaveCount(0, { timeout: 20000 });
    assert.deepEqual(await inventory(other), []);
    assert.equal((await exchange(other.token, owner.id, stale)).status, 403);
    assert.equal((await inventory()).length, 2);

    await log(one).getByRole("button", { name: "Log", exact: true }).click();
    await one.context.setOffline(true);
    await create(one, 0, "Different range on this device");
    const range = { id: crypto.randomUUID(), baseRevision: 0, dateKey: original.dateKey, cleared: false,
      block: { ...original.block, id: crypto.randomUUID(), end: original.block.start.slice(0, 2) + ":30",
        activity: "Different synced range", title: "Different synced range" } };
    assert.equal((await (await exchange(owner.token, owner.id, range)).json()).status, "accepted");
    await one.context.setOffline(false);
    await expect(log(one).getByRole("button", { name: "Different synced range", exact: true })).toBeVisible({ timeout: 20000 });
    await log(one).getByRole("button", { name: "History", exact: true }).click();
    await log(one).getByText(/Review Log copies/).click();
    await expect(log(one).getByRole("button", { name: "Use synced entry" })).toBeVisible();
    await expect(log(one).getByRole("button", { name: "Use this device’s words" })).toHaveCount(0);
    console.log("PASS Log sync and both conflict choices, original attribution, offline reload, lost reply, newer clear, mismatched ranges, and account isolation");
  } finally { await browser.close(); }
}
