import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("app/os/os-app.css", "utf8");
const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped} \\{[\\s\\S]*?\\n}`))?.[0] ?? "";
}

// One key, three sizes. Sai asked for the row tick's lit top edge on Protocol
// too, which is only a one-line change if the recipe is written once. It was
// not, so the two controls on the same orange surface had drifted apart.
test("every pressable thing is built from one key recipe", () => {
  for (const token of [
    "--os-key-lift-lg",
    "--os-key-lift-md",
    "--os-key-lift-sm",
    "--os-key-light",
    "--os-key-light-soft",
    "--os-key-unlit",
    "--os-key-leg-orange",
    "--os-key-leg-ink",
    "--os-key-sunk",
    "--os-key-press-ms",
  ]) {
    assert.match(css, new RegExp(`\\n\\s*${token}:`), `${token} is not declared`);
  }
});

test("a Protocol term is lit along its top edge, like the tick beside it", () => {
  const term = rule(
    ".circle-os .os-creative-button-shell.style-soft-clay\n  .os-protocol-block.os-creative-button",
  );
  assert.match(term, /var\(--os-key-light\)/);
  assert.match(term, /0 var\(--os-key-lift-md\) 0 var\(--os-key-leg-orange\)/);

  const tick = rule(
    ".circle-os .os-creative-button-shell.role-habit\n  .os-row-tick-habit.os-creative-button",
  );
  assert.match(tick, /var\(--os-key-light\)/);
  assert.match(tick, /0 var\(--os-key-lift-lg\) 0 var\(--os-key-leg-orange\)/);
});

// Continue, Begin, Completed today and Add this hour are a Page's one action
// just as much as Send is. They were plain buttons with nothing but `:active`,
// so none of the engine's press behaviour reached them.
test("every Page action runs through the button engine", () => {
  const engine = rule(
    ".circle-os .os-creative-button-shell.style-default .os-creative-button",
  );
  // The engine owns the states and reads the key's parts from variables, so a
  // button family names its own leg and light without restating a shadow.
  assert.match(engine, /var\(--os-key-top, var\(--os-key-light-soft\)\)/);
  assert.match(
    engine,
    /0 var\(--os-key-lift, var\(--os-key-lift-md\)\) 0 var\(--os-key-leg, var\(--os-key-leg-ink\)\)/,
  );

  // And those families now only declare parts — no states of their own.
  const parts = rule(
    ".circle-os .os-page-primary-action,\n.circle-os .os-chapter-continue,\n.circle-os .os-protocol-begin,\n.circle-os .os-log-add-current",
  );
  assert.match(parts, /--os-key-lift:/);
  assert.match(parts, /--os-key-leg:/);
  assert.match(parts, /--os-key-top:/);
  assert.doesNotMatch(parts, /box-shadow|transform|transition/);

  // No Page action is left as a bare button.
  const protocol = readFileSync("app/os/protocol-page.tsx", "utf8");
  const player = readFileSync("app/os/chapters/chapter-player.tsx", "utf8");
  assert.doesNotMatch(protocol, /<button[^>]*os-protocol-begin/s);
  assert.doesNotMatch(player, /<button[^>]*os-page-primary-action/s);
  assert.doesNotMatch(shell, /<button[^>]*os-log-add-current/s);
  assert.match(protocol, /<CreativeButton[\s\S]*?os-protocol-complete/);
});

// The shell draws a 52px frame for Send. Every other action has to grow for a
// two-line label, so it keeps its own box and the shell only carries the phase.
test("an action that sizes itself is not squeezed into Send's frame", () => {
  assert.match(
    rule(".circle-os .os-creative-button-shell.sizing-content"),
    /height: auto/,
  );
  assert.match(
    rule(".circle-os .os-creative-button-shell.sizing-content .os-creative-button"),
    /position: relative/,
  );
});

// `none` is only legal as a whole box-shadow. Substituting it for the top
// light voided the leg with it and left a face floating above nothing.
test("an unlit key still stands on its leg", () => {
  assert.doesNotMatch(css, /--os-key-top: none/);
  assert.match(css, /--os-key-unlit: inset 0 0 0 rgb\(255 248 241 \/ 0\)/);
});

test("Today and Reflect space their App Boxes with one shared gap", () => {
  assert.match(css, /--os-app-box-gap: 18px/);
  for (const selector of [
    ".circle-os .os-checkin",
    ".circle-os .os-day",
    ".circle-os .os-log-section",
    ".circle-os .mirror-week-intro",
    ".circle-os .between-intro",
    ".circle-os .vision-suggestion-session",
  ]) {
    assert.match(
      rule(selector),
      /var\(--os-app-box-gap\)/,
      `${selector} carries its own number instead of the shared gap`,
    );
  }
});

// 52, 54, 56 and 58 were four numbers for one object: a full-width tappable row.
// `--os-action-height` already existed and only some of them used it.
test("every action is one height", () => {
  for (const selector of [
    [
      ".circle-os .os-survey-choices button",
      ".circle-os .os-survey-slider > button",
      ".circle-os .os-survey-text > button",
    ].join(",\n"),
    [
      ".circle-os .os-page-primary-action",
      ".circle-os .os-page-footer > .os-add-habit-row",
    ].join(",\n"),
    ".circle-os .os-chapter-continue",
    ".circle-os .os-creative-button-slot",
    ".circle-os .os-creative-button-shell",
  ]) {
    assert.match(
      rule(selector),
      /(min-)?height: var\(--os-action-height\)/,
      `${selector.split(",")[0]} carries its own height`,
    );
  }
  // The Routine idle action is a Page action like the rest of them.
  assert.match(
    rule(
      [
        ".circle-os .os-habit .os-chapter-idle-action",
        ".circle-os .os-extra-mission-done",
      ].join(",\n"),
    ),
    /min-height: var\(--os-action-height\)/,
  );
});

// The last tappable rows in the App with no leg, no light and no movement.
test("a choice is a key, and choosing is keeping", () => {
  const parts = rule(".circle-os .os-survey-choices .os-creative-button");
  assert.match(parts, /--os-key-lift: var\(--os-key-lift-sm\)/);
  assert.match(parts, /--os-key-leg:/);
  const player = readFileSync("app/os/chapters/chapter-player.tsx", "utf8");
  assert.match(player, /<CreativeButton\n\s*aria-pressed=\{selected\}/);
  assert.match(player, /release="latch"/);
  // Taken means down.
  assert.match(
    rule(
      [
        ".circle-os .os-creative-button-shell .os-survey-choices button.selected",
        ".circle-os .os-survey-choices button.selected",
      ].join(",\n"),
    ),
    /transform: translateY\(0\)/,
  );
});

// The App Label is the one word that names where you are. It used to hold at
// opacity 0 and fade in on a timer after every page change, mode flip and send.
test("the Thoughts label does not animate", () => {
  assert.doesNotMatch(css, /os-thoughts-label-arrival/);
  assert.doesNotMatch(css, /os-thoughts-mode-toggle\.is-(waiting|visible)/);
  assert.doesNotMatch(shell, /thoughtLabelVisible/);
  assert.match(
    shell,
    /className="os-card-label os-thoughts-mode-toggle"/,
    "the label class is being switched again",
  );
});

// A press is one movement. Rest is up, holding is down, and releasing leaves
// the key where it is. Every style used to end its press with a 640ms flourish
// that ran after the finger had already left.
test("no button animates on release", () => {
  for (const gone of [
    "os-button-default-success",
    "os-ink-button-success",
    "os-clay-button-success",
    "os-liquid-button-success",
  ]) {
    assert.doesNotMatch(css, new RegExp(gone), `${gone} still bounces on release`);
  }
  // The committed state is a held-down key, not an animation — and only for a
  // latch, because a rebound has already come back up on the release.
  assert.match(
    rule(
      '.circle-os .os-creative-button-shell.style-default[data-button-release="latch"]:is(.phase-pressed, .phase-success)\n  .os-creative-button',
    ),
    /box-shadow: var\(--os-key-sunk\);[\s\S]*?transform: translateY\(0\)/,
  );
});

// The engine changes phase when the click registers, but the state behind the
// button — a habit ticking, a term being kept — lands a render later. A latch
// with nothing holding it down in that gap springs up for a frame: pressed, up,
// pressed. Every latching family has to cover success as well as pressed.
test("a latch is never drawn up once it has been pressed", () => {
  for (const held of [
    'role-habit[data-button-release="latch"]:is(.phase-pressed, .phase-success)',
    'style-soft-clay[data-button-release="latch"]:is(.phase-pressed, .phase-success)',
    'style-default[data-button-release="latch"]:is(.phase-pressed, .phase-success)',
  ]) {
    assert.ok(
      css.includes(`.circle-os .os-creative-button-shell.${held}`),
      `${held.split("[")[0]} lets go of a latch between the click and the state`,
    );
  }
});

// A press that reads as ignored is worse than no press at all.
test("the press is quick enough to read as an answer", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  const ms = (name) => Number(engine.match(new RegExp(`const ${name} = (\\d+)`))?.[1]);
  assert.ok(ms("MIN_PRESS_MS") <= 60, "the key is held down too long to feel snappy");
  assert.ok(ms("REGISTER_MS") <= 80, "the action lags too far behind the finger");
  // Worst case from finger down to the action firing.
  assert.ok(ms("MIN_PRESS_MS") + ms("REGISTER_MS") <= 140);
  // The settle beat was sized for release animations that no longer exist.
  assert.ok(ms("SETTLE_MS") <= 280);
});

// A touch pointer stops existing the moment it lifts, so the browser fires
// `pointerleave` immediately after `pointerup` — teardown, not the finger
// sliding off. Treating it as an abort put the key back up in the gap before
// the click, and the click pulled it down again: pressed, up, pressed. It never
// showed on a mouse, and never in a synthetic test that omits leave.
test("the teardown leave after a touch is not an abort", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  const abort = engine.match(/function abort\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(abort, "abort() moved");
  assert.match(
    abort,
    /if \(lifted\.current\) return;/,
    "abort() still releases on the leave that follows a lift",
  );
  // The flag has to be set when the finger lifts and cleared on a fresh press.
  assert.match(engine, /lifted\.current = true;/);
  assert.match(engine, /lifted\.current = false;/);
});

// One press, two endings. A rebound comes back up and registers from there; a
// latch stays where the finger left it because what replaces it is also down.
test("a key knows whether it rebounds or latches", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  assert.match(engine, /export type ButtonRelease = "rebound" \| "latch"/);
  assert.match(engine, /release = "rebound"/, "rebound is the default ending");
  assert.match(engine, /data-button-release=\{release\}/);
  assert.match(engine, /if \(release === "rebound"\) dispatch\("release"\)/);

  // Send and every toggle latch.
  assert.match(shell, /release="latch"\s*\n\s*styleId=\{THOUGHT_BUTTON_STYLE\}/);
  const habitLatches = shell.match(/release="latch"\n\s*role="habit"/g) ?? [];
  assert.equal(habitLatches.length, 4, "every Routine toggle should latch");
  const protocol = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(protocol, /release="latch"\n\s*role="habit"/);
});

// The press finishes as a movement before anything happens because of it.
test("a press registers a beat after it ends", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  assert.match(engine, /const MIN_PRESS_MS = \d+/);
  assert.match(engine, /const REGISTER_MS = \d+/);
  // A tap too fast to render still shows the key go down.
  assert.match(engine, /Math\.max\(0, MIN_PRESS_MS - held\)/);
  // The native default is cancelled and replayed, so a submit still submits.
  assert.match(engine, /registerTimer\.current = window\.setTimeout/);
  assert.match(engine, /owner\?\.requestSubmit\(\)/);
});

// `pointerup` lands before `click`, and the browser drops `:active` at the same
// moment. A key that returned to ready on pointerup sprang back onto its leg
// for the render in between, then dropped again when the click arrived.
test("a key stays down from the finger lifting until the click resolves", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  assert.match(engine, /onPointerUp=\{\(event\) => lift\(event, onPointerUp\)\}/);
  assert.match(engine, /onPointerCancel=\{\(event\) => abort\(event, onPointerCancel\)\}/);
  assert.match(engine, /onPointerLeave=\{\(event\) => abort\(event, onPointerLeave\)\}/);
  // Lifting must not put it back up on its own.
  const lift = engine.match(/function lift\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(lift, "lift() moved");
  // It may only release from inside the guard timeout, never straight away:
  // a press whose click never arrives still has to come back up eventually,
  // but lifting the finger on its own must leave the key exactly where it is.
  assert.match(lift, /releaseGuard\.current = window\.setTimeout/);
  assert.ok(
    lift.indexOf("window.setTimeout") < lift.indexOf('dispatch("release")'),
    "lift() releases before its guard, so the key springs back on pointerup",
  );
});

// A toggle keys its down state on :active as well as the phase, and the two
// have to describe the same key — a held tick must not look like a new object.
test("a tick holds down with the same face :active gives it", () => {
  assert.match(
    rule(
      '.circle-os .os-creative-button-shell.role-habit\n  .os-row-tick.os-creative-button:active,\n.circle-os .os-creative-button-shell.role-habit[data-button-release="latch"]:is(.phase-pressed, .phase-success)\n  .os-row-tick.os-creative-button',
    ),
    /box-shadow: var\(--os-key-sunk\);[\s\S]*?transform: translateY\(0\)/,
  );
});

// A button that stays on the Page has to be able to be pressed again. Stranded
// in `success` it could not: `committedRef` never cleared, so its owner had to
// unmount it to clean up, which is what made Send disappear after a send.
test("a button that stays mounted returns to ready", () => {
  const engine = readFileSync("app/os/button-engine.tsx", "utf8");
  assert.match(
    engine,
    /if \(previewMode \|\| role === "habit" \|\| keepMountedOnSuccess\) \{[\s\S]*?committedRef\.current = false;[\s\S]*?dispatch\("preview-reset"\);/,
  );
});

// Nothing in the Footer moves across a send. The button goes flat and disabled
// where it already is, which is exactly how it sits before a word is typed.
test("Send stays on the Page after a thought is sent", () => {
  const departure =
    shell.match(/function beginThoughtDeparture\(\)[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(departure, "the departure function moved");
  assert.doesNotMatch(departure, /setThoughtButtonVisible\(false\)/);
  // Clearing the draft is what disables it; a disabled key has no leg.
  assert.match(departure, /setRegularThoughtDraft\(""\)/);
  assert.match(
    rule(".circle-os .os-creative-button-shell.style-default .os-creative-button:disabled"),
    /box-shadow: none;[\s\S]*?transform: translateY\(0\)/,
  );
});

// A send is signalled by the thing that was sent leaving, not by the App Box
// emptying and refilling itself the way it does for any other page change.
test("sending a thought leaves the App Box alone", () => {
  assert.doesNotMatch(shell, /thoughtRefreshKey/);
  assert.doesNotMatch(shell, /update-exit/);
  assert.match(shell, /thoughtTransition === "departing" \? " is-departing" : ""/);
  assert.match(css, /@keyframes os-thought-departure/);

  // Only the answer travels in Deep Thoughts. The question was not what was
  // sent, so it holds still.
  const departure = rule(
    ".circle-os .os-thoughts-form.is-departing > .os-info-page-main,\n.circle-os .os-thoughts-form.is-departing .os-deep-thought-response",
  );
  assert.match(departure, /animation: os-thought-departure/);
  assert.doesNotMatch(departure, /os-deep-thought-question/);
});

// The one action Thoughts has looked like a different button every time it
// appeared, because it was dealt from the rotating bag.
test("Send is the standard key rather than a dealt style", () => {
  assert.match(shell, /const THOUGHT_BUTTON_STYLE = "default"/);
  assert.match(shell, /styleId=\{THOUGHT_BUTTON_STYLE\}/);
  assert.doesNotMatch(shell, /revealButtonStyle/);
});

// Chapters were the one Page family still centring their Main in the leftover
// height, and rendering it at a size no other App used.
test("a Chapter Page's Main is the shared Main text, at the forehead", () => {
  const main = rule(
    ".circle-os .os-chapter-page.os-chapter-card .os-page-main > h2",
  );
  assert.match(main, /font-size: var\(--os-page-main-font-size\)/);
  assert.match(main, /line-height: var\(--os-page-main-line-height\)/);
  assert.match(main, /letter-spacing: -0\.055em/);

  assert.doesNotMatch(
    css,
    /\.os-chapter-page\.os-chapter-card \.os-page-(body|main) \{\s*justify-content: center;/,
  );
});

// Hidden for v1, not removed. The record, the model and the Pages are all still
// here, so turning the flag back on restores the two Pages where they were.
test("the Dreamline is off, and nothing about it was deleted", () => {
  assert.match(shell, /const SHOW_DREAMLINE = false;/);
  assert.match(shell, /!SHOW_DREAMLINE \|\| dreamlineEditing/);
  assert.match(shell, /!SHOW_DREAMLINE \|\| !dreamlineEditing/);
  // The saved page index has to forget the old order, or a phone that rested on
  // a Dreamline Page reopens past the end of the App Box.
  assert.match(shell, /const habitAppVersion = "habit-protocol-v5"/);
  assert.match(shell, /<DreamlineIdlePage/);
  assert.match(shell, /<DreamlineSheetPage/);
});
