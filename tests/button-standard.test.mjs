import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("app/os/os-app.css", "utf8");
const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");

/**
 * Every rule that names this selector, run together.
 *
 * A selector rarely has a rule to itself: `.os-day` shares one with the Mirror
 * cards for its ground, and has another of its own for its spacing; a chapter
 * title shares one with the Workshop's editable line for it. Matching only the
 * first rule found reported whichever happened to come first in the file.
 *
 * The selector has to be a whole entry in the list — bounded by a comma or the
 * brace — or `.os-page-footer` would also answer for `.os-page-footer.is-empty`.
 */
function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|,)\\s*${escaped}\\s*(?:,[^{]*)?\\{[\\s\\S]*?\\n}`,
    "gm",
  );
  return (css.match(pattern) ?? []).join("\n");
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
  assert.match(shell, /release="latch"\s+styleId=\{THOUGHT_BUTTON_STYLE\}/);
  // Counted against every tick rather than against a fixed number: a tick added
  // later has to latch too, and the test should say that rather than say "4".
  const habitKeys = shell.match(/role="habit"/g) ?? [];
  const habitLatches = shell.match(/release="latch"\s+role="habit"/g) ?? [];
  assert.ok(habitKeys.length > 0);
  assert.equal(habitLatches.length, habitKeys.length, "every toggle should latch");
  const protocol = readFileSync("app/os/protocol-page.tsx", "utf8");
  assert.match(protocol, /release="latch"\s+role="habit"/);
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
