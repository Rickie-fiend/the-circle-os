import assert from "node:assert/strict";
import test from "node:test";
import {
  chapterDraftToMarkdown,
  chapterDraftToPreview,
  createChapterDraft,
  validateChapterDraft,
} from "../app/os/admin/chapter-authoring.js";
import { parseChapterMarkdown, validateChapter } from "../scripts/chapter-compiler.mjs";

test("a fresh editor draft preserves the cover, completion, and idle template order", () => {
  const draft = createChapterDraft("2026-08-01T00:00:00.000Z");
  assert.equal(draft.chapter.pages[0].type, "cover");
  assert.equal(draft.chapter.pages.at(-2).type, "result");
  assert.equal(draft.chapter.pages.at(-1).type, "idle");
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
  assert.equal(compiled.pages.length, 4);
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
