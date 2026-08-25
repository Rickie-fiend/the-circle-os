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

test("a Page's main action is a key whether or not it runs through the engine", () => {
  const engine = rule(
    ".circle-os .os-creative-button-shell.style-default .os-creative-button",
  );
  assert.match(engine, /var\(--os-key-light-soft\)/);
  assert.match(engine, /0 var\(--os-key-lift-md\) 0 var\(--os-key-leg-ink\)/);

  // Continue, Begin and Add this hour are a Page's one action just as much as
  // Send is, and they were flat: no leg, no light, no movement under a finger.
  const plain = rule(
    ".circle-os .os-page-primary-action,\n.circle-os .os-chapter-continue,\n.circle-os .os-protocol-begin,\n.circle-os .os-log-add-current",
  );
  assert.match(plain, /box-shadow:\s*\n\s*var\(--os-key-top\),\s*\n\s*0 var\(--os-key-lift\) 0 var\(--os-key-leg\)/);
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
  // The committed state is a held-down key, not an animation.
  assert.match(
    rule(".circle-os .os-creative-button-shell.style-default.phase-success .os-creative-button"),
    /box-shadow: var\(--os-key-sunk\);[\s\S]*?transform: translateY\(0\)/,
  );
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

// The gap between pointerup and click is also where a toggle sprang back, and
// those key their down state on :active rather than the phase.
test("a tick and a term hold down through the same gap", () => {
  for (const held of [
    "role-habit.phase-pressed\n  .os-row-tick.os-creative-button",
    "style-soft-clay.phase-pressed\n  .os-protocol-block.os-creative-button",
  ]) {
    assert.ok(
      css.includes(`.circle-os .os-creative-button-shell.${held} {`),
      `${held.split("\n")[0]} does not hold down between pointerup and click`,
    );
  }
  // And the held-down state is the same one :active gives, not a new look.
  assert.match(
    rule(
      ".circle-os .os-creative-button-shell.role-habit\n  .os-row-tick.os-creative-button:active,\n.circle-os .os-creative-button-shell.role-habit.phase-pressed\n  .os-row-tick.os-creative-button",
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
