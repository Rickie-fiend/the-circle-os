import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// The caller provisions a disposable local stack, synthetic accounts, and a
// published Chapter with two short-answer pages before calling this journey.
export async function verifyLocalChapterDeletion({
  appOrigin, supabaseOrigin, owner, other, chapterId, title, deleteOwner, recreateOwner, counts,
}) {
  for (const origin of [appOrigin, supabaseOrigin]) assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const endpoint = appOrigin + "/os/catalog/chapter-sync";
  const exchange = (token, account, operation = null) => fetch(endpoint, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ owner: account, operation }),
    signal: AbortSignal.timeout(12000),
  });
  async function heads(account) {
    const response = await exchange(account.token, account.id);
    assert.equal(response.status, 200, "synthetic account inventory");
    return response.json();
  }
  async function signIn(page, account) {
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  const browser = await chromium.launch();
  try {
    const contextOptions = { viewport: { width: 390, height: 844 }, serviceWorkers: "block" };
    async function profile(account) {
      const context = await browser.newContext(contextOptions);
      await context.route("**/*", route => [appOrigin, supabaseOrigin].includes(new URL(route.request().url()).origin)
        ? route.continue() : route.abort());
      const page = await context.newPage();
      page.setDefaultTimeout(18000);
      await page.goto(appOrigin + "/os/explore");
      await signIn(page, account);
      return { context, page };
    }
    const first = await profile(owner);
    const second = await profile(owner);
    const open = page => page.getByRole("link", { name: "Open " + title, exact: true }).click();
    const submit = async (page, question, answer) => {
      await page.getByRole("textbox", { name: question, exact: true }).fill(answer);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    };
    const firstQuestion = "What did you notice?";
    const nextQuestion = "What would you try next?";
    await open(first.page);
    await first.page.getByRole("button", { name: "Swipe to begin" }).click();
    await expect.poll(async () => (await heads(owner))[0]?.revision, { timeout: 20000 }).toBe(1);
    await open(second.page);
    await expect(second.page.getByRole("textbox", { name: firstQuestion })).toBeVisible();
    await second.context.setOffline(true);
    await submit(second.page, firstQuestion, "Synthetic competing answer");
    await expect(second.page.getByRole("textbox", { name: nextQuestion })).toBeVisible();
    await submit(first.page, firstQuestion, "Synthetic synced answer");
    await expect.poll(async () => (await heads(owner))[0]?.revision, { timeout: 20000 }).toBe(2);
    await second.context.setOffline(false);
    await second.page.getByRole("link", { name: "Review answers", exact: true }).click();
    await second.page.getByRole("button", { name: "Use synced answers", exact: true }).click();
    await expect(second.page.getByText("Choice synced.", { exact: true })).toBeVisible({ timeout: 20000 });
    await second.page.getByText("Saved copies", { exact: true }).click();
    await expect(second.page.getByText("Synthetic competing answer", { exact: true })).toBeVisible();
    await second.page.getByRole("link", { name: "Continue Chapter" }).click();

    const [synced] = await heads(owner);
    const control = { id: crypto.randomUUID(), baseRevision: 0, run: synced.run };
    assert.equal((await exchange(other.token, other.id, control)).status, 200);
    const otherHistory = await heads(other);
    await expect(second.page.getByRole("textbox", { name: nextQuestion })).toBeVisible();
    await second.context.setOffline(true);
    await submit(second.page, nextQuestion, "Synthetic pending offline answer");
    await expect(second.page.getByText("Swipe when ready", { exact: true })).toBeVisible();
    const retained = await second.page.evaluate(async ({ account, runId }) => new Promise((resolve, reject) => {
      const connection = indexedDB.open("circle-chapter-sync:account:" + account, 1);
      connection.onerror = () => reject(new Error("Could not open the synthetic device store."));
      connection.onsuccess = () => {
        const db = connection.result;
        const entry = db.transaction("runs").objectStore("runs").get("ledger");
        entry.onsuccess = () => { db.close(); resolve(entry.result[runId]); };
        entry.onerror = () => { db.close(); reject(new Error("Could not read the synthetic run.")); };
      };
    }), { account: owner.id, runId: chapterId + "@1" });
    assert.equal(retained.reviewed[0].device.answers[0].value, "Synthetic competing answer");
    assert.equal(retained.pending.run.answers.at(-1).value, "Synthetic pending offline answer");
    assert.deepEqual(await counts(owner.id), { runs: 1, receipts: 2 });

    await deleteOwner(owner);
    assert.deepEqual(await counts(owner.id), { runs: 0, receipts: 0 });
    assert.equal((await exchange(owner.token, owner.id)).ok, false);
    assert.equal((await exchange(owner.token, owner.id, retained.pending)).ok, false);
    await second.context.setOffline(false);
    await expect(second.page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible({ timeout: 20000 });
    for (const path of ["/os/explore", "/os/catalog/read?id=" + chapterId + "&version=1&review=1"]) {
      await second.page.goto(appOrigin + path);
      await expect(second.page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
      await expect(second.page.getByText(/Synthetic (competing|synced|pending offline) answer/)).toHaveCount(0);
    }

    const recreated = await recreateOwner(owner.email);
    assert.notEqual(recreated.id, owner.id);
    await second.page.goto(appOrigin + "/os/explore");
    await signIn(second.page, recreated);
    await expect(second.page.getByRole("link", { name: "Open " + title, exact: true })).toBeVisible();
    await expect(second.page.getByRole("link", { name: /Review answers/ })).toHaveCount(0);
    assert.deepEqual(await heads(recreated), []);
    assert.equal((await exchange(recreated.token, owner.id, retained.pending)).status, 403);
    await open(second.page);
    await expect(second.page.getByRole("button", { name: "Swipe to begin" })).toBeVisible();
    assert.deepEqual(await counts(owner.id), { runs: 0, receipts: 0 });
    assert.deepEqual(await heads(other), otherHistory);
    console.log("PASS deleted account cascade, stale upload denial, offline device lock, same-email recreation, and control account preservation");
  } finally {
    await browser.close();
  }
}
