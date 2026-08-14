import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
const css = readFileSync("app/os/os-app.css", "utf8");

test("Log uses the shared fixed-height App Box and Page anatomy", () => {
  assert.match(shell, /className="os-log-session"/);
  assert.match(shell, /frameHeight="var\(--os-app-box-min-height\)"/);
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

test("the timeline scrolls inside the fixed Page body", () => {
  assert.match(css, /\.circle-os \.os-log-page \.os-page-body \{[\s\S]*?overflow: hidden;/);
  assert.match(css, /\.circle-os \.os-log-page \.os-timeline \{[\s\S]*?overflow-y: auto;/);
  assert.match(css, /overscroll-behavior: contain/);
});
