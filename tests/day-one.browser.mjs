import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chromium, expect as browserExpect } from "@playwright/test";
import { createEmptyState, ensureDay, getDateKey } from "../app/os/circle-os-model.js";
import { createChapterRun, advanceChapterRun, chapterRunId } from "../app/os/chapters/chapter-model.js";

const baseURL = "http://127.0.0.1:3218";
const expect = browserExpect.configure({ timeout: 20_000 });
const chapters = JSON.parse(readFileSync(new URL("../app/os/chapters/published/index.json", import.meta.url))).chapters;
const latest = chapters.find(c => c.id === "day-one" && c.version === 3);
const old = chapters.find(c => c.id === "day-one" && c.version === 2);

function fixture() {
  const state = ensureDay(createEmptyState(), getDateKey());
  state.ai.baseUrl = "";
  state.profile.name = "Synthetic Day One Tester";
  state.profile.age = 30;
  return state;
}

async function saved(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2")).state);
}

async function withPage(width, state, work, pin = "") {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height: 844 },
    isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const errors = [];
  try {
    await context.route("**/*", route => new URL(route.request().url()).origin === baseURL
      ? route.continue() : route.abort());
    await context.addInitScript(({ state, pin }) => {
      if (sessionStorage.getItem("day-one-fixture")) return;
      localStorage.setItem("circle-os-state-v2", JSON.stringify({ savedAt: new Date().toISOString(), state }));
      if (pin) localStorage.setItem("circle-os-pinned-door", pin);
      sessionStorage.setItem("day-one-fixture", "yes");
    }, { state, pin });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${baseURL}/os`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
    await work(page, context);
    assert.deepEqual(errors, [], "page errors");
  } finally {
    await context.close();
    await browser.close();
  }
}

async function settled(session) {
  await expect(session.locator(".os-app-page.adjacent")).toHaveCount(0);
  await expect(session.locator(".os-app-page.current")).not.toHaveClass(/committing/);
}

async function answer(page, session, question, value) {
  await settled(session);
  const input = session.getByRole("textbox", { name: question, exact: true });
  await expect(input).toBeVisible();
  await input.fill(value);
  await session.getByRole("button", { name: "Continue", exact: true }).click();
  await settled(session);
}

async function swipeForward(page, session) {
  await settled(session);
  await session.scrollIntoViewIfNeeded();
  const box = await session.boundingBox();
  const y = box.y + Math.min(150, box.height / 2);
  await page.mouse.move(box.x + box.width * .8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, y, { steps: 14 });
  await page.mouse.up();
}

async function finish(page, session) {
  await expect(session.getByText("Swipe when ready", { exact: true })).toBeVisible();
  await swipeForward(page, session);
  await expect.poll(async () => (await saved(page)).chapters.runs["day-one@3"]?.status).toBe("completed");
}

for (const width of [390, 360]) {
  for (const action of ["", "Walk outside"]) {
    test(`Day One ${action ? "with action" : "skip action"}, summary, reload and Protocol at ${width}px`, { timeout: 120_000 }, async () => {
      const state = fixture();
      await withPage(width, state, async (page, context) => {
        const session = page.locator(".os-day-one-session");
        await expect(session.getByRole("heading", { name: "Start with what matters." })).toBeVisible();
        await session.getByRole("button", { name: /^Begin / }).click();
        await answer(page, session, "What matters most to you right now?", "I am not sure yet");
        await expect.poll(async () => (await saved(page)).chapters.runs["day-one@3"]?.currentPageId).toBe("direction");
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
        await answer(page, session, "What would you like to be different?", "I am still thinking");
        await context.setOffline(true);
        await answer(page, session, "What is one small thing you would like to try?", action);
        await expect(session.locator(".os-chapter-result .os-chapter-body")).toHaveText([
          "I am not sure yet", "I am still thinking", ...(action ? [action] : []),
        ]);
        await finish(page, session);
        await expect(page.getByRole("dialog")).toHaveCount(0);
        const stored = await saved(page);
        assert.ok(stored.outbox.length > 0, "offline evidence remains queued");
        assert.equal(stored.chapters.runs["habit-building@1"], undefined, "Habit setup was not marked complete");
        for (const key of ["habits", "tasks", "goals", "protocol", "declarations"]) {
          assert.deepEqual(stored[key], state[key], key);
        }
        // Protocol is one flip across from Routine, with its existing setup action.
        const routine = page.locator('.os-habit-session[aria-label="Routine chapter"]');
        await routine.scrollIntoViewIfNeeded();
        const box = await routine.boundingBox();
        const y = box.y + Math.min(150, box.height / 2);
        await page.mouse.move(box.x + box.width * .8, y);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * .2, y, { steps: 14 });
        await page.mouse.up();
        const start = page.getByRole("button", { name: "Start a phase", exact: true });
        await expect(start).toBeVisible();
        await start.click();
        await expect.poll(async () => Object.values((await saved(page)).protocol.runs).length).toBe(1);
        await context.setOffline(false);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
        await expect(page.locator(".os-day-one-session")).toHaveCount(0);
        const after = await saved(page);
        assert.deepEqual(after.chapters.runs["day-one@3"].answers, stored.chapters.runs["day-one@3"].answers);
        assert.equal(Object.values(after.protocol.runs).length, 1);
      });
    });
  }
}

test("completed older user sees v3; Quest entry saves the same answers", { timeout: 120_000 }, async () => {
  const state = fixture();
  const run = { ...createChapterRun(old), status: "completed", completedAt: new Date().toISOString() };
  state.chapters.runs[run.runId] = run;
  await withPage(390, state, async page => {
    const session = page.locator(".os-quest-step-session");
    await expect(session.getByRole("heading", { name: "Start with what matters." })).toBeVisible();
    await session.getByRole("button", { name: /^Begin / }).click();
    await answer(page, session, "What matters most to you right now?", "Time with family");
    await answer(page, session, "What would you like to be different?", "More time together");
    await answer(page, session, "What is one small thing you would like to try?", "");
    await finish(page, session);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    assert.deepEqual((await saved(page)).chapters.runs[run.runId], run);
  }, "chapter:day-one");
});

test("an older completion still allows the new automatic Day One cover", { timeout: 60_000 }, async () => {
  const state = fixture();
  const run = { ...createChapterRun(old), status: "completed", completedAt: new Date().toISOString() };
  state.chapters.runs[run.runId] = run;
  await withPage(390, state, async page => {
    await expect(page.getByRole("dialog", { name: "Day one", exact: true })).toBeVisible();
    await expect(page.locator(".os-day-one-session").getByRole("heading", { name: "Start with what matters." })).toBeVisible();
    assert.deepEqual((await saved(page)).chapters.runs[run.runId], run);
  });
});

test("Week Setup works after short Day One without legacy identity or commitments", { timeout: 120_000 }, async () => {
  const state = fixture();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  state.chapters.runs["day-one@3"] = { ...createChapterRun(latest), status: "completed",
    currentPageId: "complete", furthestPageId: "complete", completedAt: yesterday, updatedAt: yesterday };
  const week = chapters.find(c => c.id === "week-setup");
  await withPage(360, state, async page => {
    const session = page.locator(".os-week-setup-session");
    await session.getByRole("button", { name: /^Begin / }).click();
    for (const item of week.pages.slice(1, -1)) {
      if (item.type === "info") {
        await expect(session.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
        await swipeForward(page, session);
      } else {
        await answer(page, session, item.question, `Synthetic ${item.answerKey}`);
      }
    }
    await expect(session.getByText("Swipe when ready", { exact: true })).toBeVisible();
    await swipeForward(page, session);
    await expect.poll(async () => (await saved(page)).chapters.runs[chapterRunId(week)]?.status).toBe("completed");
    const after = await saved(page);
    assert.equal(Object.keys(after.habits.definitions).length, 0);
    assert.equal(Object.keys(after.goals.items).length, 1);
    assert.equal(Object.keys(after.tasks.items).length, 1);
    assert.equal(Object.keys(after.protocol.runs).length, 1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
    assert.equal((await saved(page)).chapters.runs[chapterRunId(week)].status, "completed");
  });
});

test("older unfinished Day One resumes its own question after reload", { timeout: 90_000 }, async () => {
  const state = fixture();
  let run = advanceChapterRun(old, createChapterRun(old), { page: old.pages[0] });
  run = advanceChapterRun(old, run, { page: old.pages[1], value: "Synthetic past answer" });
  state.chapters.runs[run.runId] = run;
  await withPage(360, state, async page => {
    await expect(page.locator(".os-day-one-session").getByRole("heading", { name: "Now picture yourself two years from now." })).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".os-day-one-session").getByRole("heading", { name: "Now picture yourself two years from now." })).toBeVisible();
    assert.deepEqual((await saved(page)).chapters.runs[run.runId].answers, run.answers);
    assert.equal((await saved(page)).chapters.runs[chapterRunId(latest)], undefined);
  });
});

test("Day One publication uses the shared outcomes without a second setup sheet", { timeout: 120_000 }, async () => {
  const state = fixture();
  const sparks = JSON.parse(readFileSync(new URL("../app/os/chapters/published/sparks.json", import.meta.url))).chapters;
  const timestamp = new Date().toISOString();
  for (const chapter of [...chapters, ...sparks].filter(c => c.id !== "habit-building" && (c.id !== "day-one" || c.version !== 3))) {
    state.chapters.runs[chapterRunId(chapter)] = { ...createChapterRun(chapter), status: "completed", completedAt: timestamp };
  }
  const habit = chapters.find(c => c.id === "habit-building");
  state.chapters.runs[chapterRunId(habit)] = { ...createChapterRun(habit), deferredAt: timestamp, dismissedAt: timestamp };
  state.chapters.runs["day-one@3"] = { ...createChapterRun(latest), dismissedAt: timestamp };
  await withPage(390, state, async page => {
    await page.evaluate(async chapter => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open("circle-os-chapter-publications", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("chapters", { keyPath: "key" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction("chapters", "readwrite");
        tx.objectStore("chapters").put({ key: "synthetic-day-one-publication", chapter,
          targetApp: "thoughts", audienceProfileId: "local", visibility: "public",
          delivery: "on-view", source: "admin", publishedAt: new Date().toISOString() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      window.dispatchEvent(new Event("circle-os:chapter-published"));
    }, latest);
    const session = page.locator(".os-checkin-session");
    await expect(session.getByRole("heading", { name: "Start with what matters." })).toBeVisible();
    await session.getByRole("button", { name: /^Begin / }).click();
    await answer(page, session, "What matters most to you right now?", "Rest");
    await expect.poll(() => page.getByRole("dialog").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")))).toEqual([]);
    await answer(page, session, "What would you like to be different?", "More sleep");
    await answer(page, session, "What is one small thing you would like to try?", "");
    await finish(page, session);
    const after = await saved(page);
    for (const key of ["habits", "tasks", "goals", "protocol", "declarations"]) assert.deepEqual(after[key], state[key], key);
    assert.equal(after.chapters.runs["day-one@3"].answers[0].value, "Rest");
    await expect.poll(() => page.getByRole("dialog").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")))).toEqual([]);
  });
});
