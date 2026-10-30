import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { chromium, expect as browserExpect } from "@playwright/test";
import {
  addHabitDefinition, createEmptyState, ensureDay, normalizeState, updateHabitDefinitionParts,
} from "../app/os/circle-os-model.js";
import { chapterRunId, createChapterRun } from "../app/os/chapters/chapter-model.js";
import { priceDays } from "../app/os/athena-pricing-model.js";

// Start an isolated local Next server on this port. External traffic is blocked;
// these fixtures never connect to the owner's profile server or browser data.
const baseURL = "http://localhost:3218";
const expect = browserExpect.configure({ timeout: 20_000 });
const timestamp = new Date().toISOString();
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" })
  .format(new Date(Date.now() - 6 * 60 * 60 * 1000));
const chapters = ["index", "sparks"].flatMap((name) =>
  JSON.parse(readFileSync(new URL(`../app/os/chapters/published/${name}.json`, import.meta.url))).chapters,
);
const habitChapter = chapters.find((chapter) => chapter.id === "habit-building");
const habitRunId = chapterRunId(habitChapter);
const answerValues = {
  "habit-action": "Walk five minutes",
  "habit-time-place": "after coffee",
  "habit-identity": "a steady walker",
};

function fixture() {
  let state = ensureDay(createEmptyState(), date);
  state.ai.baseUrl = "";
  state.profile.name = "Isolated Core Tester";
  state.profile.age = 34;
  // Skip unrelated delivery/setup journeys; their completion is not tested here.
  for (const chapter of chapters.filter((chapter) => ["day-one", "habit-building", "log-setup"].includes(chapter.id))) {
    const lastPage = chapter.pages.at(-1).id;
    state.chapters.runs[chapterRunId(chapter)] = {
      ...createChapterRun(chapter), status: "completed", completedAt: timestamp,
      updatedAt: timestamp, currentPageId: lastPage, furthestPageId: lastPage,
    };
  }
  state.chapters.runs[habitRunId].answers = habitChapter.pages
    .filter((page) => answerValues[page.answerKey])
    .map((page) => ({ pageId: page.id, answerKey: page.answerKey,
      value: answerValues[page.answerKey], displaySnapshot: answerValues[page.answerKey],
      answeredAt: timestamp }));
  const added = addHabitDefinition(state, "synthetic-starter");
  state = updateHabitDefinitionParts(added.state, added.id, {
    action: "ONBOARDING ANSWER", cue: "ONBOARDING ANSWER",
    identity: "ONBOARDING ANSWER", text: "ONBOARDING ANSWER",
  });
  const starter = state.habits.definitions[added.id];
  starter.createdAt = new Date(Date.parse(timestamp) - 86400000).toISOString();
  starter.updatedAt = new Date(Date.parse(timestamp) - 3600000).toISOString();
  return state;
}

async function withPage(width, state, work) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height: 844 },
    isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const errors = [];
  try {
    await context.route("**/*", (route) => new URL(route.request().url()).origin === baseURL
      ? route.continue() : route.abort());
    await context.addInitScript(({ state, timestamp }) => {
      if (sessionStorage.getItem("core-fixture-seeded")) return;
      localStorage.setItem("circle-os-state-v2", JSON.stringify({ savedAt: timestamp, state }));
      sessionStorage.setItem("core-fixture-seeded", "yes");
    }, { state, timestamp });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseURL}/os`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
    await work(page);
    assert.deepEqual(errors, [], "browser page errors");
  } finally {
    await context.close();
    await browser.close();
  }
}

async function savedState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-state-v2")).state);
}

async function reload(page) {
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15_000 });
  await expect(page.locator(".os-route-stage")).toHaveAttribute("aria-busy", "false");
}

async function swipeReading(page, expectedIndex) {
  const session = page.getByRole("region", { name: "Athena's Reading", exact: true });
  await session.scrollIntoViewIfNeeded();
  const box = await session.boundingBox();
  const y = box.y + Math.min(box.height / 2, 170);
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await savedState(page)).appSessions["vision-between"]?.index)
    .toBe(expectedIndex);
  await expect(session.locator(".os-app-page.adjacent")).toHaveCount(0);
  await expect(session.locator(".os-app-page.current")).not.toHaveClass(/committing/);
}

for (const width of [390, 360]) {
  for (const scenario of ["old starter", "missing starter", "later edit"]) {
    test(`saved Habit recovery: ${scenario} at ${width}px`, { timeout: 120_000 }, async () => {
      const state = fixture();
      if (scenario === "missing starter") state.habits.definitions = {};
      if (scenario === "later edit") {
        const habit = state.habits.definitions["synthetic-starter"];
        Object.assign(habit, { action: "Read two pages", cue: "before bed",
          identity: "a reader", text: "Read two pages before bed",
          updatedAt: new Date(Date.parse(timestamp) + 3600000).toISOString() });
      }
      const expectedAction = scenario === "later edit" ? "Read two pages" : "Walk five minutes";
      await withPage(width, state, async (page) => {
        for (let visit = 0; visit < 3; visit++) {
          if (visit) await reload(page);
          await expect(page.getByRole("textbox", { name: `Edit habit: ${expectedAction}`, exact: true })).toBeVisible();
          await expect.poll(async () => Object.values((await savedState(page)).habits.definitions)
            .map((habit) => habit.action)).toEqual([expectedAction]);
          const stored = await savedState(page);
          const habit = Object.values(stored.habits.definitions)[0];
          assert.deepEqual(stored.chapters.runs[habitRunId].answers, state.chapters.runs[habitRunId].answers);
          if (scenario === "later edit") {
            assert.deepEqual(habit, normalizeState(state).habits.definitions["synthetic-starter"]);
          } else {
            assert.equal(habit.setupRunId, habitRunId);
            assert.equal(habit.cue, answerValues["habit-time-place"]);
            assert.equal(habit.identity, answerValues["habit-identity"]);
            assert.equal(stored.profile.identityFocus, answerValues["habit-identity"]);
          }
        }
      });
    });
  }

  for (const mode of ["empty", "derived", "authored"]) {
    test(`Reflect evidence and ${mode} reading at ${width}px`, { timeout: 120_000 }, async () => {
      const state = fixture();
      // This task's recovery checks are separate from the Reflect fixture.
      state.habits.definitions["synthetic-starter"].setupRunId = habitRunId;
      const activity = "Walk in the park";
      const direct = "You recorded a walk in the park at 08:00.";
      const guess = "A working guess: time outside may matter to you.";
      if (mode !== "empty") {
        state.athenaMemory.rhythms = [{ id: "synthetic-walk", statement: direct,
          sourceRefs: [{ sourceType: "time-block", sourceId: "synthetic-walk-block", capturedAt: timestamp }] }];
        state.athenaMemory.portrait = [{ id: "synthetic-guess", statement: guess }];
      }
      if (mode === "authored") {
        state.athenaMemory.updatedAt = timestamp;
        state.athenaMemory.reading = { cover: "A recorded morning outside.",
          days: [{ heading: "Your recorded morning", paragraphs: [direct] }],
          alive: [], shape: [{ heading: "A question to hold", paragraphs: [guess] }] };
      }
      await withPage(width, state, async (page) => {
        // Save through the real Log controls rather than injecting activity.
        await page.locator('[data-log-hour="8"] .os-empty-hour').click();
        await page.getByRole("textbox", { name: "Main activity at 08:00", exact: true }).fill(activity);
        await page.getByRole("button", { name: "Save main activity", exact: true }).click();
        await expect.poll(async () => (await savedState(page)).days[date].timeBlocks
          .some((block) => (block.title || block.activity) === activity)).toBe(true);
        const before = await savedState(page);
        const block = before.days[date].timeBlocks.find((item) => (item.title || item.activity) === activity);
        assert.equal(block.start, "08:00");
        const pricing = priceDays([before.days[date]]);
        assert.equal(pricing.recordedHours, 1);
        assert.equal(pricing.categories.find((category) => category.id === "walking").hours, 1);
        if (mode !== "empty") {
          // Install synthetic prepared memory after recording the evidence.
          // This verifies rendering, not the external preparation pipeline.
          before.athenaMemory.rhythms[0].sourceRefs[0].sourceId = block.id;
          await page.evaluate(async (state) => {
            const record = { savedAt: new Date().toISOString(), state };
            localStorage.setItem("circle-os-state-v2", JSON.stringify(record));
            const database = await new Promise((resolve, reject) => {
              const request = indexedDB.open("circle-os", 1);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            await new Promise((resolve, reject) => {
              const transaction = database.transaction("state", "readwrite");
              transaction.objectStore("state").put(record, "circle-os-state-v2");
              transaction.oncomplete = resolve;
              transaction.onerror = () => reject(transaction.error);
            });
            database.close();
          }, before);
        }
        await reload(page);
        await expect(page.getByRole("button", { name: activity, exact: true })).toBeVisible();
        await page.getByRole("link", { name: "Reflect", exact: true }).click();
        const reading = page.getByRole("region", { name: "Athena's Reading", exact: true });
        if (mode === "empty") {
          await expect(reading.getByRole("heading", { name: "Athena is still learning.", exact: true })).toBeVisible();
          await expect(reading).not.toContainText(direct);
        } else {
          await expect(reading.getByRole("heading", { name: mode === "authored"
            ? "A recorded morning outside." : "Athena has not written this morning.", exact: true })).toBeVisible();
          await swipeReading(page, 1);
          await expect(reading.getByText(direct, { exact: true })).toBeVisible();
          await swipeReading(page, 2);
          await expect(reading.getByText("What feels alive", { exact: true })).toBeVisible();
          await swipeReading(page, 3);
          await expect(reading.getByText(guess, { exact: true })).toBeVisible();
        }
        const after = await savedState(page);
        if (mode !== "empty") assert.equal(after.athenaMemory.rhythms[0].sourceRefs[0].sourceId, block.id);
        assert.deepEqual(after.days[date].timeBlocks, before.days[date].timeBlocks);
        assert.deepEqual(after.athenaMemory.editions, before.athenaMemory.editions);
        assert.equal(after.athenaMemory.editions.length, mode === "authored" ? 1 : 0);
      });
    });
  }
}
