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

// Sai: "we dont need v1 v2 yet. because nobody is seeing this until i release
// v1 so everything here is v1."
test("a published chapter opens for editing at the version it already has", () => {
  const published = chapterDraftToPreview(createChapterDraft("2026-08-01T00:00:00.000Z"));
  published.id = "published-test";
  published.version = 4;
  const libraryItem = chapterDefinitionToDraft(published, "2026-08-01T00:00:00.000Z");
  const next = createNextVersionDraft(libraryItem, "2026-08-02T00:00:00.000Z");
  assert.equal(libraryItem.workflowStatus, "published");
  assert.equal(next.workflowStatus, "draft");

  // Editing is editing. Bumping the version protected people mid-way through a
  // chapter from having its questions changed under them; there is nobody on
  // the other side of these yet, and a version he never asked for is a version
  // he has to reason about.
  assert.equal(next.chapter.version, 4);
  assert.equal(libraryItem.chapter.version, 4);

  // The draft is still its own row, and still opens ready to work on.
  assert.notEqual(next.draftId, libraryItem.draftId);
  assert.notEqual(next.chapter.pages.at(-1).type, "idle");
  assert.equal(next.chapter.pages.at(-1).body, "");
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

// Sai: "i want exactly the same preview to match exactly the same, fonts and
// sized and spacings with actual displayed chapter, by the same standard."
test("the Workshop's editable lines are the chapter's own lines", () => {
  const css = readFileSync("app/os/os-app.css", "utf8");

  // One rule for the published Page and the line he types it on, so the two
  // cannot drift into different sizes of the same words.
  assert.match(
    css,
    /\.os-chapter-page\.os-chapter-card \.os-page-main > h2,\s+\.circle-os \.os-chapter-inline-copy\.main \{/,
  );
  assert.match(
    css,
    /\.os-chapter-page\.os-chapter-card \.os-chapter-body,\s+\.circle-os \.os-chapter-inline-copy\.sub \{/,
  );
  assert.match(css, /\.circle-os \.os-chapter-why,\s+\.circle-os \.os-chapter-inline-copy\.why \{/);

  // The Workshop keeps no second copy of those numbers. Each name appears
  // exactly twice: once in the shared rule above, and once in the phone's
  // font-size floor, which has to name it as a `textarea` to lift it.
  const times = (needle) => css.split(needle).length - 1;
  assert.equal(times(".os-chapter-inline-copy.main"), 2);
  assert.equal(times(".os-chapter-inline-copy.sub"), 2);

  // The phone's 16px floor is what actually made them different sizes: a
  // textarea is slammed to 16px so iOS will not zoom on focus, and the h2 and
  // p beside it never were.
  assert.match(
    css,
    /\.circle-os textarea\.os-chapter-inline-copy\.main \{\s+font-size: var\(--os-page-main-font-size\) !important;/,
  );
  assert.match(css, /\.circle-os textarea\.os-chapter-inline-copy\.sub \{/);
  assert.match(css, /\.circle-os textarea\.os-chapter-inline-copy\.why \{/);

  // And no ornament that the design system does not have. Sai: "the orange bar
  // on the left, to look like a quote, thats not part of the design system."
  const why = css.slice(
    css.indexOf(".circle-os .os-chapter-why,"),
    css.indexOf(".circle-os .theme-dark .os-chapter-why"),
  );
  assert.doesNotMatch(why, /border-left/);
  assert.doesNotMatch(why, /padding-left/);
});

// Sai: "add a feature to rerun the chapter, in workshop ... so that if i want
// to try and re run the chapter on the splashscreen i could."
test("a chapter can be offered again without clearing the device", async () => {
  const { createEmptyState } = await import("../app/os/circle-os-model.js");
  const { resetChapterRuns, chapterEverCompleted } = await import(
    "../app/os/chapters/chapter-model.js"
  );

  const done = (id, version) => [
    `${id}@${version}`,
    {
      runId: `${id}@${version}`,
      chapterId: id,
      chapterVersion: version,
      status: "completed",
      answers: [{ answerKey: "a", value: "b" }],
      currentPageId: "last",
      furthestPageId: "last",
      startedAt: "2026-09-01T09:00:00.000Z",
      completedAt: "2026-09-01T09:10:00.000Z",
      updatedAt: "2026-09-01T09:10:00.000Z",
    },
  ];
  const base = createEmptyState();
  const state = {
    ...base,
    chapters: {
      ...base.chapters,
      runs: Object.fromEntries([done("day-one", 1), done("day-one", 2), done("week-setup", 1)]),
    },
    habits: { ...base.habits, definitions: { h1: { id: "h1", action: "read" } } },
  };
  assert.equal(chapterEverCompleted(state.chapters.runs, "day-one"), true);

  const next = resetChapterRuns(state, "day-one", "cover", "2026-09-07T00:00:00.000Z");

  // Every version of it, because that is what the gates ask about.
  assert.equal(chapterEverCompleted(next.chapters.runs, "day-one"), false);
  assert.equal(next.chapters.runs["day-one@1"].status, "not-started");
  assert.equal(next.chapters.runs["day-one@2"].currentPageId, "cover");
  assert.equal(next.chapters.runs["day-one@2"].answers.length, 0);

  // Reset, not deleted. `mergeServerState` merges runs as a union with the
  // server's copy and keeps whichever has the later `updatedAt`, so a deleted
  // run comes straight back on the next sync. A reset one carries a fresh
  // timestamp and wins.
  assert.ok(next.chapters.runs["day-one@2"], "the run must still exist");
  assert.equal(next.chapters.runs["day-one@2"].updatedAt, "2026-09-07T00:00:00.000Z");

  // Another chapter is not touched, and neither is what the run wrote. Running
  // day one again must not hand him a second character.
  assert.equal(next.chapters.runs["week-setup@1"].status, "completed");
  assert.deepEqual(next.habits.definitions, state.habits.definitions);

  // And the Workshop offers it.
  const editor = readFileSync("app/os/admin/chapter-editor.tsx", "utf8");
  assert.match(editor, /async function runChapterAgain\(source: ChapterDraft\)/);
  assert.match(editor, /resetChapterRuns\(state, id, source\.chapter\.pages\[0\]\?\.id\)/);
  assert.match(editor, /className="os-admin-preview-rerun"/);
});
