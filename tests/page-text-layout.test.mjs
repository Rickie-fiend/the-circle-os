import assert from "node:assert/strict";
import test from "node:test";

import { pageTextLayout } from "../app/os/page-text-layout.js";

test("the body grows down by every Main line beyond three", () => {
  const baseBodyHeight = 306.8;
  const lineHeight = 42.336;
  const bodyHeight = (lines) =>
    pageTextLayout({
      baseBodyHeight,
      lineHeight,
      mainHeight: lineHeight * lines,
    }).bodyMinHeight;

  assert.equal(bodyHeight(1), baseBodyHeight);
  assert.equal(bodyHeight(3), baseBodyHeight);
  assert.equal(bodyHeight(4), baseBodyHeight + lineHeight);
  assert.equal(bodyHeight(6), baseBodyHeight + lineHeight * 3);
});
