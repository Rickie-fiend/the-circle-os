import assert from "node:assert/strict";
import test from "node:test";
import {
  FIRST_USE_APP_SPACES,
  chapterDefinitionToDraft,
  chapterDraftToMarkdown,
  chapterDraftToPreview,
  createChapterDraft,
  createFirstUseChapterDraft,
  createNextVersionDraft,
  validateChapterDraft,
} from "../app/os/admin/chapter-authoring.js";
import { parseChapterMarkdown, validateChapter } from "../scripts/chapter-compiler.mjs";

test("a fresh editor draft preserves the cover and final result template order", () => {
  const draft = createChapterDraft("2026-08-01T00:00:00.000Z");
  assert.equal(draft.chapter.pages[0].type, "cover");
  assert.equal(draft.chapter.pages.at(-1).type, "result");
  assert.equal(draft.chapter.pages.at(-1).body, "");
  assert.deepEqual(validateChapterDraft(draft), []);
});

test("editor Markdown compiles with the existing chapter compiler", () => {
  const draft = createChapterDraft("2026-08-01T00:00:00.000Z");
  draft.chapter.id = "editor-test";
  draft.chapter.title = "Editor test";
  const markdown = chapterDraftToMarkdown(draft);
  const compiled = validateChapter(parseChapterMarkdown(markdown, "editor-test.md"));
  assert.equal(compiled.id, "editor-test");
  assert.equal(compiled.status, "draft");
  assert.equal(compiled.pages.length, 3);
});

test("preview uses the published runtime shape without changing draft workflow", () => {
  const draft = createChapterDraft("2026-08-01T00:00:00.000Z");
  const preview = chapterDraftToPreview(draft);
  assert.equal(preview.status, "published");
  assert.equal(draft.workflowStatus, "draft");
});

test("ready validation blocks unresolved author notes", () => {
  const draft = createChapterDraft("2026-08-01T00:00:00.000Z");
  draft.authorNotes.push({ id: "note-1", text: "Tighten the ending", resolved: false });
  assert.match(validateChapterDraft(draft).join(" "), /Resolve every author note/);
});

test("every current app has a valid first-time-use starter", () => {
  assert.deepEqual(FIRST_USE_APP_SPACES, ["check-in", "habit", "log", "thoughts", "vision", "reflection"]);
  for (const appSpace of FIRST_USE_APP_SPACES) {
    const draft = createFirstUseChapterDraft(appSpace, "2026-08-01T00:00:00.000Z");
    assert.deepEqual(validateChapterDraft(draft), [], appSpace);
    assert.equal(draft.chapter.pages[0].type, "cover", appSpace);
    assert.match(draft.chapter.pages.at(-1).type, /confirm|result/, appSpace);
    assert.equal(draft.chapter.pages.at(-1).body, "", appSpace);
    validateChapter(parseChapterMarkdown(chapterDraftToMarkdown(draft), `${appSpace}.md`));
  }
});

test("a published chapter opens as an immutable library item and copies to the next version", () => {
  const published = chapterDraftToPreview(createChapterDraft("2026-08-01T00:00:00.000Z"));
  published.id = "published-test";
  published.version = 4;
  const libraryItem = chapterDefinitionToDraft(published, "2026-08-01T00:00:00.000Z");
  const next = createNextVersionDraft(libraryItem, "2026-08-02T00:00:00.000Z");
  assert.equal(libraryItem.workflowStatus, "published");
  assert.equal(next.workflowStatus, "draft");
  assert.equal(next.chapter.version, 5);
  assert.notEqual(next.chapter.pages.at(-1).type, "idle");
  assert.equal(next.chapter.pages.at(-1).body, "");
  assert.equal(libraryItem.chapter.version, 4);
});
