import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import placeholderPool from "../app/os/note-placeholders/note-placeholders.json" with { type: "json" };
import {
  nextNotePlaceholder,
  normalizeNotePlaceholders,
} from "../app/os/note-placeholders/note-placeholder-pool.js";

const shell = readFileSync(
  new URL("../app/os/circle-os-shell.tsx", import.meta.url),
  "utf8",
);
const player = readFileSync(
  new URL("../app/os/chapters/chapter-player.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../app/os/os-app.css", import.meta.url),
  "utf8",
);
const anchor = readFileSync(
  new URL("../app/os/stable-route-anchor.ts", import.meta.url),
  "utf8",
);
const mirror = readFileSync(
  new URL("../app/os/mirror/page.tsx", import.meta.url),
  "utf8",
);
const compiler = readFileSync(
  new URL("../scripts/chapter-compiler.mjs", import.meta.url),
  "utf8",
);
const authoring = readFileSync(
  new URL("../app/os/admin/chapter-authoring.js", import.meta.url),
  "utf8",
);

test("Note placeholders are a separate short rotation", () => {
  const placeholders = normalizeNotePlaceholders(placeholderPool);
  assert.equal(placeholders.length, 5);
  assert.ok(placeholders.every((item) => item.text.length <= 32));
  let current = nextNotePlaceholder(placeholderPool);
  for (let index = 0; index < placeholders.length * 2; index += 1) {
    const next = nextNotePlaceholder(placeholderPool, current.id);
    assert.notEqual(next.id, current.id);
    current = next;
  }
});

test("Note flips to a labelled Line while Thoughts keeps Deep Thoughts", () => {
  assert.match(shell, /useAppBack<"note" \| "line">\("note"\)/);
  assert.match(shell, /useAppBack<"regular" \| "deep">\("regular"\)/);
  assert.match(shell, /aria-label="Show a Line"/);
  assert.match(shell, /aria-label=\{`Line kind: \$\{kindLabel\}`\}/);
  assert.match(shell, /className="os-line-kind"/);
  assert.doesNotMatch(shell, /Load a private Note chapter/);
});

test("chapters visit Thoughts without mutating legacy Note publications", () => {
  assert.match(
    shell,
    /publication\.targetApp === "note" \|\|\s+publication\.targetApp === "thoughts"/,
  );
  assert.match(shell, /backApp=\{checkInThoughtsCard\(\)\}/);
  assert.match(compiler, /app: "thoughts"/);
  assert.match(authoring, /appSpaces: \["thoughts"\]/);
  assert.match(authoring, /app: "thoughts"/);
});

test("a terminal Page protects arrival, then waits for a deliberate swipe", () => {
  assert.match(player, /CHAPTER_TERMINAL_GUARD_MS = 1200/);
  assert.match(player, /Swipe when ready/);
  assert.match(player, /isCompletionPage &&\s+completionReady/);
  assert.match(player, /isCompletionPage && !completionReady \? \(\) => undefined/);
  assert.doesNotMatch(player, /COMPLETION_DWELL_MS|completion-exit/);
});

test("Reflect has a native-first fallback for a visible downstream reading", () => {
  assert.match(anchor, /ResizeObserver/);
  assert.match(anchor, /window\.requestAnimationFrame/);
  assert.match(anchor, /Math\.abs\(missedDistance\) > ANCHOR_TOLERANCE_PX/);
  assert.match(anchor, /window\.scrollBy\(0, missedDistance\)/);
  assert.match(mirror, /useStableRouteAnchor\(visionSessionRef, athenaSessionRef\)/);
});

test("Main and Sub are separated by one fixed gap, not a fraction of a line", () => {
  // Sai set the number on 2026-08-20: "after the main text, there should be a
  // padding of about 25px between main text and below content." It was 0.36lh,
  // which changed with the type size of whatever sat underneath.
  assert.match(css, /--os-main-sub-gap: 25px/);
  assert.equal((css.match(/--os-main-sub-gap:/g) || []).length, 1);
});
