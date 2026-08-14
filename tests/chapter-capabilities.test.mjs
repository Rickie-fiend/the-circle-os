import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { chapterCompletion } from "../app/os/chapters/chapter-capabilities.js";
import { assertPublishedChapterCapabilities } from "../app/os/chapters/chapter-registry-check.js";
import { advanceChapterRun, createChapterRun } from "../app/os/chapters/chapter-model.js";

const published = JSON.parse(
  await readFile(
    new URL("../app/os/chapters/published/index.json", import.meta.url),
    "utf8",
  ),
);
const sparks = JSON.parse(
  await readFile(
    new URL("../app/os/chapters/published/sparks.json", import.meta.url),
    "utf8",
  ),
);

function ending(id, session, pages, extra = {}) {
  return { id, version: 1, session, pages, ...extra };
}

test("published declarations and setup chapters all dwell into their idle page", () => {
  const ids = [
    "declare-vision",
    "declare-mission-statement",
    "declare-typical-tuesday",
    "declare-dreamline",
    "habit-building",
    "log-setup",
  ];
  const chapters = ids.map((id) =>
    published.chapters
      .filter((chapter) => chapter.id === id)
      .sort((left, right) => right.version - left.version)[0],
  );
  assert.ok(chapters.every(Boolean));
  assert.deepEqual(chapters.map(chapterCompletion), ids.map(() => "dwell"));
  for (const chapter of chapters) {
    const completion = chapter.pages.at(-2);
    const idle = chapter.pages.at(-1);
    const run = {
      ...createChapterRun(chapter),
      status: "in-progress",
      currentPageId: completion.id,
      furthestPageId: completion.id,
    };
    const completed = advanceChapterRun(chapter, run, { page: completion });
    assert.equal(completed.status, "completed", chapter.id);
    assert.equal(completed.currentPageId, idle.id, chapter.id);
  }
});

test("completion behavior is independent of the session label", () => {
  const pages = [
    { id: "complete", type: "result" },
    { id: "idle", type: "idle" },
  ];
  assert.equal(chapterCompletion(ending("one", "check-in", pages)), "dwell");
  assert.equal(chapterCompletion(ending("two", "unknown", pages)), "dwell");
});

test("final completion declares swipe and malformed endings fail closed", () => {
  assert.equal(
    chapterCompletion(ending("final", "anything", [{ id: "complete", type: "result" }])),
    "swipe",
  );
  assert.throws(
    () => chapterCompletion(ending("unknown", "anything", [{ id: "complete", type: "result" }], { completion: "vanish" })),
    /unknown completion/,
  );
  assert.throws(
    () => chapterCompletion(ending("ambiguous", "anything", [{ id: "complete", type: "result" }, { id: "more", type: "info" }])),
    /cannot answer how it ends/,
  );
  assert.throws(
    () => chapterCompletion(ending("input-final", "anything", [{ id: "answer", type: "short-text" }])),
    /cannot answer how it ends/,
  );
  assert.equal(
    chapterCompletion(ending("log-setup", "log", [{ id: "sleep", type: "time" }])),
    "submit",
  );
});

test("every shipped chapter resolves all declared capabilities", () => {
  assert.doesNotThrow(() =>
    assertPublishedChapterCapabilities([...published.chapters, ...sparks.chapters]),
  );
});

async function appSources(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) sources.push(...await appSources(path));
    if (entry.isFile() && [".js", ".ts", ".tsx"].includes(extname(entry.name))) {
      sources.push([path, await readFile(path, "utf8")]);
    }
  }
  return sources;
}

test("app code never switches behavior with session equality", async () => {
  const appRoot = fileURLToPath(new URL("../app", import.meta.url));
  for (const [path, source] of await appSources(appRoot)) {
    assert.doesNotMatch(source, /\bsession\s*(?:===|!==)/, path);
  }
});
