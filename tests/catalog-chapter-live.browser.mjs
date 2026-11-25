import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { createChapterPage } from '../app/os/admin/chapter-authoring.js';
import { chapterHistory } from '../app/os/chapter-history.js';
import { advanceChapterRun, createChapterRun, moveChapterRun } from '../app/os/chapters/chapter-model.js';
import { createEmptyState, CIRCLE_OS_STORAGE_KEY } from '../app/os/circle-os-model.js';

const savedAnswer = 'A synthetic answer saved on version one.';
const originalQuestion = 'What did you notice in version one?';

export async function verifyHostedChapter({ a, b, appOrigin, origin, syntheticDraft, call, ok, operation }) {
  const draft = structuredClone(syntheticDraft);
  const id = draft.draftId;
  const [cover, , finish] = draft.chapter.pages;
  const question = { ...createChapterPage('short-text', 1), title: 'Original question', question: originalQuestion };
  draft.chapter.title = 'Synthetic Chapter version one';
  draft.chapter.pages = [
    { ...cover, title: 'Original synthetic cover' },
    question,
    { ...finish, title: 'Original synthetic finish' },
  ];
  const save = (value, revision) => call('/rest/v1/rpc/circle_save_content_draft', {
    method: 'POST', token: a.token,
    body: { draft: value, expected_revision: revision, operation_id: operation() },
  });
  const change = command => call('/rest/v1/rpc/circle_catalog_change', {
    method: 'POST', token: a.token, body: { command: { id, ...command, operationId: operation() } },
  });
  await ok(await save(draft, 0), 'save synthetic Chapter version one');
  await ok(await change({ action: 'publish', draftId: id, draftRevision: 1, draft, expectedRevision: 0 }), 'publish synthetic Chapter version one');
  await ok(await change({ action: 'withdraw', expectedRevision: 1 }), 'hide synthetic Chapter from Explore');
  const newer = structuredClone(draft);
  newer.chapter.title = 'Synthetic Chapter version two';
  newer.chapter.pages[1].question = 'What changed in version two?';
  await ok(await save(newer, 1), 'save synthetic Chapter version two');
  await ok(await change({ action: 'publish', draftId: id, draftRevision: 2, draft: newer, expectedRevision: 2 }), 'publish synthetic Chapter version two');

  const catalog = version => appOrigin + '/os/catalog?' + new URLSearchParams({ id, version });
  const read = version => fetch(catalog(version), {
    headers: { Authorization: 'Bearer ' + b.token }, signal: AbortSignal.timeout(20_000),
  });
  assert.equal((await fetch(catalog(1), { signal: AbortSignal.timeout(20_000) })).status, 403);
  const first = (await (await ok(await read(1), 'signed-in catalog reads exact version one')).json()).content.chapter;
  const second = (await (await ok(await read(2), 'signed-in catalog reads exact version two')).json()).content.chapter;
  assert.equal(first.pages[1].question, originalQuestion);
  assert.equal(second.pages[1].question, newer.chapter.pages[1].question);

  const initial = createChapterRun(first);
  const answered = advanceChapterRun(first, initial, { page: first.pages[1], value: savedAnswer });
  const unfinished = moveChapterRun(first, answered, first.pages[1].id);
  const readerPath = '/os/catalog/read?' + new URLSearchParams({ id, version: 1 });
  const browser = await chromium.launch();
  try {
    const blank = await reader(browser, { account: a, appOrigin, origin });
    await blank.page.goto(appOrigin + readerPath + '&preview=1');
    const preview = blank.page.locator('.os-swipe-session[aria-label="Published chapter preview"]');
    await expect(preview.getByRole('heading', { name: 'Original synthetic cover' })).toBeVisible();
    await preview.getByRole('button', { name: 'Swipe to begin', exact: true }).click();
    await expect(preview.getByRole('textbox', { name: originalQuestion, exact: true })).toBeVisible();
    assert.deepEqual(await blank.runs(), {}, 'a preview creates no personal run');
    const emptyArtwork = await blank.homePixels();

    const signedIn = await reader(browser, { account: b, appOrigin, origin, unfinished });
    await signedIn.page.goto(appOrigin + readerPath);
    await signedIn.page.reload();
    const reading = signedIn.page.locator('.os-swipe-session[aria-label="Published chapter reading"]');
    await expect(reading.getByRole('textbox', { name: originalQuestion, exact: true })).toHaveValue(savedAnswer);
    await reading.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(reading.getByText('Swipe when ready', { exact: true })).toBeVisible();
    await swipeToFinish(signedIn.page, reading);
    await signedIn.page.waitForURL('**/os/explore');
    await expect.poll(async () => (await signedIn.runs())[unfinished.runId]?.status).toBe('completed');
    await signedIn.page.goto(appOrigin + readerPath);
    await signedIn.page.reload();
    await expect(reading).toBeVisible();
    const runs = await signedIn.runs();
    assert.deepEqual(Object.keys(runs), [unfinished.runId]);
    assert.ok(runs[unfinished.runId].imprintFinish, 'one completion carries Home contribution timing');

    // Standalone catalog runs have no entry action in the current Quest History UI.
    // Check the real History projection with the persisted run and hosted definitions.
    const history = chapterHistory(runs, [first, second]);
    assert.equal(history.length, 1);
    assert.equal(history[0].version, 1);
    assert.equal(history[0].title, first.title);
    assert.deepEqual(history[0].answers.map(({ question, text }) => ({ question, text })), [
      { question: originalQuestion, text: savedAnswer },
    ]);
    assert.ok(await signedIn.homePixels() > emptyArtwork, 'Home renders the saved Chapter contribution');
    assert.deepEqual(await blank.runs(), {});
    console.log('PASS hosted Chapter preview, exact-version resume, finish, saved History projection and Home artwork');
  } finally {
    await browser.close();
  }
}

// The caller supplies a new two-edition fixture with version 2 listed in
// Explore, and two independent authenticated sessions for its synthetic owner.
export async function verifyHostedChapterSync({ appOrigin, origin, confirmedTestOrigin, id, currentTitle, owner, peer, other }) {
  assert.match(appOrigin, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
  assert.equal(origin, confirmedTestOrigin);
  assert.match(origin, /^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
  assert.notEqual(other.id, owner.id);
  assert.equal(peer.id, owner.id);
  assert.notEqual(peer.session.refresh_token, owner.session.refresh_token);
  const endpoint = appOrigin + '/os/catalog/chapter-sync';
  const exchange = (account, requestedOwner, operation = null) => fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(account ? { Authorization: 'Bearer ' + account.session.access_token } : {}) },
    body: JSON.stringify({ owner: requestedOwner, operation }), signal: AbortSignal.timeout(15000),
  });
  const inventory = async (account = owner) => {
    const response = await exchange(account, account.id);
    assert.equal(response.status, 200, 'signed-in Chapter inventory');
    return response.json();
  };
  const edition = version => appOrigin + '/os/catalog/read?' + new URLSearchParams({ id, version });
  assert.deepEqual(await inventory(), [], 'fixture owner starts empty');
  assert.equal((await exchange(null, owner.id)).ok, false);

  const browser = await chromium.launch();
  try {
    const one = await reader(browser, { account: owner, appOrigin, origin, seedState: false });
    await one.page.goto(edition(1));
    await one.page.getByRole('button', { name: 'Swipe to begin', exact: true }).click();
    const answer = page => page.getByRole('textbox', { name: originalQuestion, exact: true });
    await expect(answer(one.page)).toBeVisible();
    await expect.poll(async () => (await inventory())[0]?.revision, { timeout: 20000 }).toBe(1);

    const two = await reader(browser, { account: peer, appOrigin, origin, seedState: false });
    await two.page.goto(appOrigin + '/os/explore');
    await two.page.getByRole('link', { name: 'Open ' + currentTitle, exact: true }).click();
    await expect(answer(two.page)).toHaveValue('');
    const profiles = [one, two];
    const answers = ['Synthetic edit from profile one', 'Synthetic edit from profile two'];
    await Promise.all(profiles.map(async ({ context, page }, index) => {
      await context.setOffline(true);
      await answer(page).fill(answers[index]);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByText('Swipe when ready', { exact: true })).toBeVisible();
    }));
    assert.equal((await inventory())[0].run.answers.length, 0, 'offline answers are still only on their devices');
    await one.page.close();
    one.page = await one.context.newPage();

    // Hold the two real requests at the browser until both have arrived, then
    // let the hosted server process them together against the same revision.
    const ready = Promise.withResolvers();
    const arrived = new Set();
    async function race(route) {
      const operation = route.request().postDataJSON()?.operation;
      if (operation?.baseRevision === 1) {
        arrived.add(operation.id);
        if (arrived.size === 2) ready.resolve();
        await ready.promise;
      }
      await route.continue();
    }
    await Promise.all(profiles.map(({ context }) => context.route(endpoint, race)));
    const timer = setTimeout(() => ready.resolve(), 25000);
    try {
      await Promise.all(profiles.map(({ context }) => context.setOffline(false)));
      await one.page.goto(edition(1));
      await ready.promise;
      assert.equal(arrived.size, 2, 'both hosted writes reached the race');
    } finally {
      clearTimeout(timer);
      for (const { context } of profiles) await context.unroute(endpoint, race);
    }
    await expect.poll(async () => (await inventory())[0]?.revision, { timeout: 20000 }).toBe(2);
    const [accepted] = await inventory();
    const winnerIndex = answers.indexOf(accepted.run.answers[0].value);
    assert.ok(winnerIndex >= 0);
    const winner = profiles[winnerIndex], loser = profiles[1 - winnerIndex];
    await expect(loser.page.getByText('This Chapter changed on another device. Both copies are saved.')).toBeVisible({ timeout: 20000 });
    await loser.page.reload();
    await expect(loser.page.getByText('This Chapter changed on another device. Both copies are saved.')).toBeVisible();
    const competing = await loser.page.evaluate(async ({ accountId, runId }) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('circle-chapter-sync:account:' + accountId, 1);
        request.onerror = () => reject(Error('Could not open the test device ledger.'));
        request.onsuccess = () => {
          const db = request.result;
          const get = db.transaction('runs').objectStore('runs').get('ledger');
          get.onsuccess = () => { db.close(); resolve(get.result[runId]?.competing?.answers[0]?.value); };
          get.onerror = () => { db.close(); reject(Error('Could not read the competing answer.')); };
        };
      });
    }, { accountId: owner.id, runId: id + '@1' });
    assert.equal(competing, answers[1 - winnerIndex]);

    let finish, attempts = 0;
    await winner.context.route(endpoint, async route => {
      const operation = route.request().postDataJSON()?.operation;
      if (operation?.run.status !== 'completed') return route.continue();
      const reply = await route.fetch();
      assert.equal(reply.status(), 200);
      assert.deepEqual(await reply.json(), { status: 'accepted', revision: 3 });
      attempts++;
      if (!finish) {
        finish = operation;
        return route.abort();
      }
      assert.deepEqual(operation, finish);
      return route.fulfill({ response: reply });
    });
    await expect(winner.page.getByText('Swipe when ready', { exact: true })).toBeVisible();
    await swipeToFinish(winner.page, winner.page.getByLabel('Published chapter reading'));
    await winner.page.waitForURL('**/os/explore');
    await expect.poll(() => attempts, { timeout: 25000 }).toBe(2);
    await expect(loser.page.getByText('Chapter complete.', { exact: true })).toBeVisible({ timeout: 20000 });
    const [finished] = await inventory();
    assert.equal(finished.revision, 3);
    assert.equal(finished.run.chapterVersion, 1);
    assert.equal(finished.run.status, 'completed');
    assert.equal(finished.run.answers[0].value, answers[winnerIndex]);
    assert.ok(finished.run.imprintFinish?.day);

    assert.deepEqual(await inventory(other), []);
    assert.equal((await exchange(other, owner.id)).status, 403);
    assert.equal((await exchange(other, owner.id, finish)).status, 403);
    assert.deepEqual(await inventory(), [finished]);
    console.log('PASS hosted Chapter sync, exact edition, offline reopen, concurrent saves, lost receipt retry, and account isolation');
  } finally {
    await browser.close();
  }
}

async function swipeToFinish(page, reading) {
  await reading.scrollIntoViewIfNeeded();
  const box = await reading.boundingBox();
  assert.ok(box);
  const y = box.y + Math.min(150, box.height / 2);
  await page.mouse.move(box.x + box.width * .8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, y, { steps: 14 });
  await page.mouse.up();
}

async function reader(browser, { account, appOrigin, origin, unfinished, seedState = true }) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    timezoneId: 'Asia/Bangkok', reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  const hostedOrigin = new URL(origin).origin;
  await context.route('**/*', route => [appOrigin, hostedOrigin].includes(new URL(route.request().url()).origin)
    ? route.continue() : route.abort());
  const state = createEmptyState();
  if (unfinished) state.chapters.runs[unfinished.runId] = unfinished;
  const stateKey = CIRCLE_OS_STORAGE_KEY + ':account:' + account.id;
  const authKey = 'circle-os-auth:' + new URL(origin).host + ':session';
  await context.addInitScript(({ appOrigin, authKey, stateKey, session, record }) => {
    if (location.origin !== appOrigin || sessionStorage.getItem('catalog-chapter-seeded')) return;
    if (record || !localStorage.getItem(authKey)) localStorage.setItem(authKey, JSON.stringify(session));
    if (record) localStorage.setItem(stateKey, JSON.stringify(record));
    sessionStorage.setItem('catalog-chapter-seeded', 'yes');
  }, { appOrigin, authKey, stateKey, session: account.session, record: seedState ? { state, savedAt: new Date().toISOString() } : null });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  return {
    context, page,
    runs: () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.chapters.runs, stateKey),
    async homePixels() {
      await page.goto(appOrigin + '/os/home');
      const canvas = page.getByRole('img', { name: 'Activity colors on the accepted shape' });
      await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 15_000 });
      return canvas.evaluate(element => {
        const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
        let colored = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index] > pixels[index + 1] + 20) colored++;
        }
        return colored;
      });
    },
  };
}
