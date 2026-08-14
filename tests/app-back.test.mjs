import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controller = readFileSync(
  new URL("../app/os/app-back.ts", import.meta.url),
  "utf8",
);
const shell = readFileSync(
  new URL("../app/os/circle-os-shell.tsx", import.meta.url),
  "utf8",
);
const protocol = readFileSync(
  new URL("../app/os/protocol-page.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../app/os/os-app.css", import.meta.url),
  "utf8",
);

test("Thoughts, Routine and Protocol use one App back controller", () => {
  assert.match(shell, /useAppBack<"regular" \| "deep">/);
  assert.match(shell, /useAppBack<"habit" \| "yesterday">/);
  assert.match(protocol, /useAppBack<"phase" \| "home">/);
  assert.doesNotMatch(shell, /thoughtModeTimer|habitModeTimer|mode-refreshing/);
  assert.match(controller, /APP_FLIP_EXIT_MS = 260/);
  assert.match(controller, /APP_FLIP_TOTAL_MS = 620/);
});

test("the shared flip holds geometry and becomes immediate for reduced motion", () => {
  assert.match(controller, /os-app-flip-hold/);
  assert.match(controller, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.os-app-flip-hold \.os-app-window/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.os-app-flip-leaving/);
});

test("Protocol labels its sides and keeps editing as an action", () => {
  assert.match(protocol, />\s*Phases\s*</);
  assert.match(protocol, />\s*Protocol\s*</);
  assert.match(protocol, />\s*Edit phase\s*</);
  assert.doesNotMatch(protocol, />\s*Done\s*:\s*Protocol\s*</);
});
