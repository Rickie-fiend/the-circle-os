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
const chapterPlayer = readFileSync(
  new URL("../app/os/chapters/chapter-player.tsx", import.meta.url),
  "utf8",
);
const appSession = readFileSync(
  new URL("../app/os/app-session.tsx", import.meta.url),
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
  assert.match(controller, /APP_FLIP_RESIZE_MS = 440/);
  assert.match(controller, /APP_FLIP_TOTAL_MS = 840/);
});

test("the shared flip holds geometry and becomes immediate for reduced motion", () => {
  assert.match(controller, /os-app-flip-hold/);
  assert.match(controller, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.os-app-flip-hold \.os-app-window/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.os-app-flip-leaving/);
  assert.match(controller, /easeFrameToIncomingSide\(\)/);
  assert.match(controller, /releaseFrameThree/);
  assert.match(controller, /--os-app-flip-height/);
  assert.match(css, /os-app-flip-resizing[\s\S]*height 440ms/);
  assert.match(css, /os-app-flip-arrival 500ms/);
  assert.doesNotMatch(appSession, /easeKey/);
  assert.doesNotMatch(chapterPlayer, /idleEaseKey/);
  assert.doesNotMatch(shell, /idleEaseKey/);
});

test("Protocol labels its sides and keeps editing as an action", () => {
  assert.match(protocol, />\s*Phases\s*</);
  assert.match(protocol, />\s*Protocol\s*</);
  assert.match(protocol, />\s*Edit phase\s*</);
  assert.doesNotMatch(protocol, />\s*Done\s*:\s*Protocol\s*</);
});

test("Routine declares identity-stack placement while Record declares content flow", () => {
  assert.match(shell, /data-os-app-heading/);
  assert.match(shell, /idlePlacement=\{[\s\S]*?"content-flow"[\s\S]*?"identity-stack"/);
  assert.match(chapterPlayer, /placement=\{isIdle \? idlePlacement : undefined\}/);
  assert.match(appSession, /if \(!main \|\| !mainText\) \{\s*clearMeasurement\(\);/);
});

test("Routine and Protocol share named heading, stack, header and Footer placement", () => {
  assert.doesNotMatch(shell, /className="os-protocol-name-edit os-routine-name-edit"/);
  assert.match(shell, /className="os-app-page-heading os-routine-name-edit"/);
  assert.match(protocol, /className="os-app-page-heading os-protocol-name-edit"/);
  assert.match(chapterPlayer, /idlePlacement === "identity-stack"[\s\S]*?os-app-page-stacks/);
  assert.match(shell, /className="os-routine-body"/);
  assert.match(protocol, /os-page-sub os-app-page-stacks os-protocol-terms/);
  assert.match(css, /\.os-page-layout\.os-placement-identity-stack \.os-page-header/);
  assert.match(css, /\.os-app-page-heading \{[\s\S]*?margin: 0\.35rem 0 1rem;/);
  assert.match(css, /\.os-app-page-stacks \{[\s\S]*?display: grid;/);
  assert.match(css, /\.os-page-layout\.os-placement-identity-stack > \.os-page-footer > button/);
});

test("Routine, Protocol and Log name the shared Page placement contract", () => {
  assert.match(appSession, /export type AppPagePlacement/);
  assert.match(appSession, /"balanced"[\s\S]*"identity-stack"[\s\S]*"content-flow"/);
  assert.match(protocol, /placement="identity-stack"/);
  assert.match(protocol, /placement="content-flow"/);
  assert.match(shell, /className="os-log-page"[\s\S]*placement="content-flow"/);
});
