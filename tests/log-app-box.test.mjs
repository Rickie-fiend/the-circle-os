import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
const css = readFileSync("app/os/os-app.css", "utf8");

test("Log uses the shared App Box and Page anatomy, and grows", () => {
  assert.match(shell, /className="os-log-session"/);
  // No frame height. Log grows downward like every other App Box; pinning it
  // to the default height made a day readable only through a slot.
  assert.doesNotMatch(shell, /frameHeight/);
  assert.match(shell, /className="os-log-page"/);
  assert.match(shell, /headerLeft={<p className="os-card-label">Log<\/p>}/);
  assert.match(shell, /heading={<h2 id="day-heading">Your day, hour by hour<\/h2>}/);
  assert.match(shell, /className="os-log-add-current"/);
  assert.doesNotMatch(shell, /className="os-section-heading"/);
});

test("the Log App Box owns its dark frame geometry", () => {
  const sessionRule = css.match(/\.circle-os \.os-log-session \{[\s\S]*?\n}/)?.[0] ?? "";
  assert.match(sessionRule, /background:/);
  assert.match(sessionRule, /border: 1px/);
  assert.match(sessionRule, /border-radius: var\(--r-box\)/);
  assert.match(sessionRule, /box-shadow:/);
  assert.doesNotMatch(css.match(/\.circle-os \.os-timeline \{[\s\S]*?\n}/)?.[0] ?? "", /border-radius|box-shadow|background:/);
});

test("the timeline does not scroll inside its own body", () => {
  const bodyRule =
    css.match(/\.circle-os \.os-log-page \.os-page-body \{[\s\S]*?\n}/)?.[0] ?? "";
  const timelineRule =
    css.match(/\.circle-os \.os-log-page \.os-timeline \{[\s\S]*?\n}/)?.[0] ?? "";
  assert.doesNotMatch(bodyRule, /overflow/);
  assert.doesNotMatch(timelineRule, /overflow/);
});
