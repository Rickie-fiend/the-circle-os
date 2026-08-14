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
});

test("Protocol labels its sides and keeps editing as an action", () => {
  assert.match(protocol, />\s*Phases\s*</);
  assert.match(protocol, />\s*Protocol\s*</);
  assert.match(protocol, />\s*Edit phase\s*</);
  assert.doesNotMatch(protocol, />\s*Done\s*:\s*Protocol\s*</);
});

test("Routine centres its identity while Record clears stale text offsets", () => {
  assert.match(shell, /data-os-main-text/);
  assert.match(shell, /idleTextLayout=\{habitMode === "yesterday" \? "content" : "auto"\}/);
  assert.match(chapterPlayer, /textLayout=\{isIdle \? idleTextLayout : undefined\}/);
  assert.match(appSession, /if \(!main \|\| !mainText\) \{\s*clearMeasurement\(\);/);
});

test("Routine mirrors Protocol title and Footer geometry", () => {
  const routineFooter = css.match(
    /\.circle-os \.os-habit \.os-chapter-idle \.os-page-footer \{([^}]*)\}/,
  )?.[1];
  const protocolName = css.match(
    /\.circle-os \.os-protocol-name \{([^}]*)\}/,
  )?.[1];
  const routineName = css.match(
    /\.circle-os \.os-routine-name-edit \{([^}]*)\}/,
  )?.[1];
  const routineBody = css.match(
    /\.circle-os \.os-routine-body \{([^}]*)\}/,
  )?.[1];
  const routineAction = css.match(
    /\.circle-os \.os-habit \.os-chapter-idle \.os-add-habit-row \{([^}]*)\}/,
  )?.[1];

  assert.ok(routineFooter);
  assert.ok(protocolName);
  assert.ok(routineName);
  assert.ok(routineBody);
  assert.ok(routineAction);
  assert.doesNotMatch(routineFooter, /min-height|padding-top/);
  assert.match(css, /\.circle-os \.os-page-footer \{[\s\S]*?min-height: 52px;[\s\S]*?padding-top: var\(--os-body-footer-gap\);/);
  assert.match(protocolName, /margin: 0\.35rem 0 1rem;/);
  assert.match(routineName, /margin: 0\.35rem 0 1rem;/);
  assert.match(routineBody, /padding-top: 0;/);
  assert.match(routineAction, /font-size: var\(--text-md\);/);
  assert.match(routineAction, /margin-top: 0\.4rem;/);
  assert.match(routineAction, /min-height: var\(--touch-min\);/);
  assert.match(routineAction, /padding: 0\.6rem 0\.7rem;/);
});
