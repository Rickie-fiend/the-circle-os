import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mirror = readFileSync("app/os/mirror/page.tsx", "utf8");
const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");

test("Reflect never turns a Page by itself while Today keeps its dwell", () => {
  assert.doesNotMatch(mirror, /rotateMs=/);
  assert.match(shell, /rotateMs=\{IDLE_PAGE_DWELL_MS\}/);
  assert.equal(
    shell.match(/rotateMs=\{IDLE_PAGE_DWELL_MS\}/g)?.length,
    1,
    "Note and Thoughts are the only timed App session",
  );
  assert.match(shell, /rotateIdleApps=\{false\}/);
  assert.doesNotMatch(shell, /rotateIdleApps=\{!sealedProtocolDay\}/);
});

test("leaving an offered Note caption commits it as the person's text", () => {
  assert.match(
    shell,
    /const nextTitle = titleDraft\.trim\(\) \|\| placeholder\.trim\(\)/,
  );
  assert.match(shell, /onCommit\(nextTitle, nextNote\)/);
});
