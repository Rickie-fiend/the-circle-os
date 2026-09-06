import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Sai: "the collapse day and end of the app box, there should be no gap, when
// there is no button. the button is where the app box extend."
test("a key is what extends the box; without one the row takes no room", () => {
  const session = readFileSync("app/os/app-session.tsx", "utf8");
  const css = readFileSync("app/os/os-app.css", "utf8");

  // The row knows whether it is holding anything.
  assert.match(session, /className=\{`os-page-footer\$\{footer \? "" : " is-empty"\}`\}/);

  // The height and the gap above it belong to the key. Empty, they are a band
  // of nothing between the last line and the box's edge — most visibly under
  // the Week's folded day on the six days that have no review to offer.
  assert.match(
    css,
    /\.os-page-footer\.is-empty \{\s+min-height: 0;\s+padding-top: 0;/,
  );
  assert.match(
    css,
    /\.os-page-footer\.is-empty \.os-info-page-spacer \{\s+min-height: 0;/,
  );

  // And with a key the row is a key's height and stands off the body, so the
  // box grows by exactly the key.
  assert.match(
    css,
    /\.circle-os \.os-page-footer \{[\s\S]*?min-height: var\(--os-action-height\);\s+padding-top: var\(--os-body-footer-gap\);/,
  );
});
