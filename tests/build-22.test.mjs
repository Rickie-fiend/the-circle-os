import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSession = readFileSync(
  new URL("../app/os/app-session.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../app/os/os-app.css", import.meta.url),
  "utf8",
);
const model = readFileSync(
  new URL("../app/os/circle-os-model.js", import.meta.url),
  "utf8",
);
const shell = readFileSync(
  new URL("../app/os/circle-os-shell.tsx", import.meta.url),
  "utf8",
);

function exportedFunction(name) {
  const match = model.match(
    new RegExp(`export function ${name}\\([\\s\\S]*?(?=\\nexport function |$)`),
  );
  assert.ok(match, `missing ${name}`);
  return match[0];
}

test("controlled Routine typing stores a raw draft and commits only on blur", () => {
  const draft = exportedFunction("updateHabitDefinitionDraft");
  assert.doesNotMatch(draft, /cleanHabitPart|\.trim\(/);
  assert.match(shell, /function changeHabit[\s\S]*?updateHabitDefinitionDraft/);
  assert.match(shell, /function finishHabitEdit[\s\S]*?updateHabitDefinition\(/);
  assert.doesNotMatch(
    shell.match(/function changeHabit[\s\S]*?\n  }/)?.[0] || "",
    /\.trim\(|cleanHabitPart/,
  );
});

test("the other controlled model editors do not trim between keystrokes", () => {
  for (const name of [
    "updateRoutineIdentity",
    "updateTask",
    "updateProtocolItem",
  ]) {
    assert.doesNotMatch(
      exportedFunction(name),
      /cleanHabitPart|const\s+\w+\s*=\s*[^;]*\.trim\(/,
      name,
    );
  }
  assert.match(shell, /onChange=\{\(event\) => setTitleDraft\(event\.currentTarget\.value\)\}/);
  assert.match(shell, /onChange=\{\(event\) => setNoteDraft\(event\.currentTarget\.value\)\}/);
});

test("a new-page reveal decorates but never blocks pointer or trackpad input", () => {
  const startSwipe = appSession.match(
    /function startSwipe[\s\S]*?(?=\n  function continueSwipe)/,
  )?.[0] || "";
  const trackpad = appSession.match(
    /function useTrackpadSwipe[\s\S]*?(?=\n  return \()/,
  )?.[0] || "";
  assert.doesNotMatch(startSwipe, /attentionArmed|attentionShowing/);
  assert.doesNotMatch(trackpad, /attentionArmed|attentionShowing/);
  for (const selector of ["update-armed", "update-arrival"]) {
    const rule = css.match(
      new RegExp(`\\.circle-os \\.os-app-window\\.${selector} \\{[\\s\\S]*?\\n\\}`),
    )?.[0] || "";
    assert.ok(rule, `missing ${selector} rule`);
    assert.doesNotMatch(rule, /pointer-events/);
  }
});

test("a Line keeps its setup behind the reveal and waits", () => {
  assert.match(shell, /useAppBack<"note" \| "line">\("note"\)/);
  assert.match(shell, /revealedLine\?\.kind === "quote" \? \[0\] : \[0, 1\]/);
  assert.match(shell, /setRevealedLinePage\(nextIndex\)/);
  assert.doesNotMatch(shell, /Swipe to close/);

  // A Line no longer leaves on a timer. It used to close after a dwell, which
  // took the words away mid-sentence and sometimes before a punchline had been
  // read at all. Sai: "they should never fade away until i dismiss, react, or
  // complete." Three ways out, all of them his.
  assert.doesNotMatch(shell, /LINE_DWELL_MS|closeLine/);
  assert.match(shell, /onForwardBoundary=\{noteLineActive \? passLineForward/);
  assert.match(shell, /onBackwardBoundary=\{noteLineActive \? dismissLineBackward/);
  assert.match(shell, /function reactToRevealedLine/);
});

test("a Line carries no edge, only its kind at the top left", () => {
  const rule =
    css.match(/> \.os-line-page \{[\s\S]*?\n}/)?.[0] ?? "";
  assert.doesNotMatch(rule, /box-shadow/);
  assert.match(shell, /headerLeft=\{kind\}/);
  assert.doesNotMatch(shell, /headerRight=\{kind\}/);
});

test("an empty Note shows its whole offered caption as a dimmed hint", () => {
  // scrollHeight ignores a placeholder, so an explicit height measured from an
  // empty value clipped every caption that wrapped.
  assert.match(
    readFileSync("app/os/text-area-size.ts", "utf8"),
    /if \(!editor\.value\)[\s\S]*?removeProperty\("height"\)/,
  );
  assert.match(
    css,
    /os-inline-checkin-title::placeholder \{[\s\S]*?color: var\(--c-neutral-500\)[\s\S]*?opacity: 1/,
  );
});
