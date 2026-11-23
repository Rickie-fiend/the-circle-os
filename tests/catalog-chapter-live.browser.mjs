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
    await blank.page.goto(appOrigin + readerPath);
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
    await reading.scrollIntoViewIfNeeded();
    const box = await reading.boundingBox();
    assert.ok(box);
    const y = box.y + Math.min(150, box.height / 2);
    await signedIn.page.mouse.move(box.x + box.width * .8, y);
    await signedIn.page.mouse.down();
    await signedIn.page.mouse.move(box.x + box.width * .2, y, { steps: 14 });
    await signedIn.page.mouse.up();
    await expect.poll(async () => (await signedIn.runs())[unfinished.runId]?.status).toBe('completed');
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

async function reader(browser, { account, appOrigin, origin, unfinished }) {
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
    localStorage.setItem(authKey, JSON.stringify(session));
    localStorage.setItem(stateKey, JSON.stringify(record));
    sessionStorage.setItem('catalog-chapter-seeded', 'yes');
  }, { appOrigin, authKey, stateKey, session: account.session, record: { state, savedAt: new Date().toISOString() } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  return {
    page,
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
