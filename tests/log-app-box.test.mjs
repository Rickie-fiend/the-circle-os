import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
const css = readFileSync("app/os/os-app.css", "utf8");

test("Log uses the shared App Box and Page anatomy, and grows", () => {
  // The Dreamline card back became Pages, so the session carries no flip class.
  assert.match(shell, /className="os-log-session"/);
  // No frame height. Log grows downward like every other App Box; pinning it
  // to the default height made a day readable only through a slot.
  assert.doesNotMatch(shell, /frameHeight/);
  assert.match(shell, /className="os-log-page"/);
  assert.match(shell, /headerLeft={<p className="os-card-label">Log<\/p>}/);
  // The Log title is his own words now, editable like Routine's identity and a
  // Protocol's name, and it carries the shared Main-to-content gap under it.
  assert.match(shell, /className="os-app-page-heading os-day-name-edit"/);
  // Until it is named it is called by its weekday, not complimented.
  assert.match(shell, /placeholder=\{logTodayName\}/);
  assert.match(css, /\.os-day-name-edit \{\s*margin-bottom: var\(--os-main-sub-gap\)/s);
  // The one action is Now, in the header where every App puts it. Sai: "remove
  // add this hour button at the bottom. instead at top right header, add 'Now'
  // button."
  assert.doesNotMatch(shell, /className="os-log-add-current"/);
  assert.match(shell, /<button className="os-new-habit" onClick=\{openNow\} type="button">/);
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

// Sai: "can you fix the clock on the log app. the indicator is always moving
// and it did not seem quick ... the pointer is never there to indicate, it
// took a while to load and to point at its time. it better be ready when the
// log app is loaded. and feel like its simple as it should be."
test("the clock hand is drawn on its row, not measured onto the timeline", () => {
  const shell = readFileSync("app/os/circle-os-shell.tsx", "utf8");
  const css = readFileSync("app/os/os-app.css", "utf8");

  // It is a child of the row that owns the hour, rendered with it. Nothing to
  // measure means nothing to arrive late: the hand is in the same paint as the
  // rows rather than in a second one after an effect has run.
  assert.match(
    shell,
    /\{isCurrentHour \? \(\s*<span aria-label="Current time" className="os-current-time" \/>/,
  );

  // The measuring apparatus is gone, all of it. Matched against the code
  // rather than the file, so the comment explaining the removal can keep
  // naming what was removed.
  const code = shell
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /markerTop/);
  assert.doesNotMatch(code, /liveMarkerTop/);
  assert.doesNotMatch(code, /timelineRef/);
  assert.doesNotMatch(code, /liveHourProgress/);

  // Placed by CSS, and not creeping. The thirty-second linear transition on
  // `top` is what made it always moving.
  const hand = css.slice(
    css.indexOf(".circle-os .os-current-time {"),
    css.indexOf(".circle-os .os-current-time::after"),
  );
  assert.match(hand, /position: absolute;\s+top: 50%;/);
  assert.doesNotMatch(hand, /transition/);

  // And the row it hangs on is the positioning context, or it would fly to the
  // top of the timeline.
  assert.match(
    css,
    /\.circle-os \.os-timeline article \{[\s\S]*?position: relative;/,
  );
});
