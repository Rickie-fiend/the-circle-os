import assert from "node:assert/strict";
import test from "node:test";

import { pageTextLayout } from "../app/os/page-text-layout.js";

test("Main centres through three lines, then keeps the three-line top", () => {
  const baseBodyHeight = 306.8;
  const lineHeight = 42.336;
  const opticalShift = -1;
  const top = (lines) =>
    pageTextLayout({
      baseBodyHeight,
      lineHeight,
      mainHeight: lineHeight * lines,
      opticalShift,
    }).mainTop;

  assert.equal(top(1) + lineHeight / 2, baseBodyHeight / 2 - 1);
  assert.equal(top(2) + lineHeight, baseBodyHeight / 2 - 1);
  assert.equal(top(3) + (lineHeight * 3) / 2, baseBodyHeight / 2 - 1);
  assert.equal(top(4), top(3));
  assert.equal(top(6), top(3));
});

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
