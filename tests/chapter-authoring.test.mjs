import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

// Sai: "Improve the admin chapter workshop. its a mass. first of all, all the
// chapters should be collapse from the start. its tiring to scroll pass all.
// and why does it have to be create next version, or use template. it doesnt
// make sense. we can just be able to edit or delete."
test("the workshop opens closed, and its actions are edit and delete", () => {
  const editor = readFileSync("app/os/admin/chapter-editor.tsx", "utf8");

  // Nothing is expanded on arrival. Every app and every group opened at once
  // meant scrolling past the whole library to reach anything.
  assert.doesNotMatch(editor, /className="os-admin-library-app" key=\{app\} open/);
  assert.doesNotMatch(
    editor,
    /className="os-admin-library-group" key=\{group\.classification\} open/,
  );

  // One verb for opening a chapter, whatever kind it is. The mechanisms stay
  // underneath — a published chapter opens as its next version because a
  // chapter somebody has answered cannot change under them — but they are not
  // the name of a button any more.
  assert.match(editor, /async function editChapter\(source: ChapterDraft, kind: LibraryKind\)/);
  // Matched against the code rather than the file, so the comment explaining
  // the change can keep naming the buttons it replaced.
  const code = editor
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /Create next version/);
  assert.doesNotMatch(code, /Use template/);
  assert.doesNotMatch(code, /Use this starter/);

  // Delete stays where deleting is actually possible: a draft on this device.
  // Published chapters and starters ship in the build.
  const row = editor.slice(
    editor.indexOf('<div className={kind === "draft" ? "three" : ""}>'),
    editor.indexOf("</article>", editor.indexOf('<div className={kind === "draft" ? "three" : ""}>')),
  );
  assert.match(row, /kind === "draft" \? "Publish" : "Edit"/);
  assert.match(row, /kind === "draft" \? <>[\s\S]*?deleteDraft\(item\)/);
});

// Sai: "the preview template must be the same standard we are using default."
test("a blank chapter starts in the theme the App actually uses", () => {
  const authoring = readFileSync("app/os/admin/chapter-authoring.js", "utf8");
  const blank = authoring.slice(
    authoring.indexOf("export function createChapterDraft("),
    authoring.indexOf("const FIRST_USE_STARTERS"),
  );
  // Every chapter in the ladder is dark, because that is what a chapter given
  // the whole screen looks like here.
  assert.match(blank, /theme: "dark"/);
  assert.doesNotMatch(blank, /theme: "light"/);
});
