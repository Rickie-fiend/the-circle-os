import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  LINE_KINDS,
  LINE_MEMORY,
  mergeSeenLines,
  normalizeLinePool,
  rememberLine,
  selectLine,
} from "../app/os/lines/line-pool.js";

const pool = JSON.parse(readFileSync("app/os/lines/lines.json", "utf8"));

test("every shipped line is readable and of a known kind", () => {
  const lines = normalizeLinePool(pool);
  assert.ok(lines.length >= 40, `expected a real pool, got ${lines.length}`);
  for (const line of lines) {
    assert.ok(line.text.length > 0, `${line.id} has no words`);
    assert.ok(LINE_KINDS.includes(line.kind), `${line.id} has kind ${line.kind}`);
  }
  assert.equal(new Set(lines.map((l) => l.id)).size, lines.length, "ids are unique");
});

test("jokes are exactly a setup and punchline, and facts keep a reveal", () => {
  const lines = normalizeLinePool(pool);
  for (const line of lines.filter(({ kind }) => kind === "joke")) {
    assert.ok(line.text, `${line.id} has no setup`);
    assert.ok(line.sub, `${line.id} has no punchline`);
    assert.equal(
      (line.text.match(/[.!?](?=\s+\S)/g) || []).length,
      0,
      `${line.id} has more than one setup line`,
    );
    assert.equal(
      (line.sub.match(/[.!?](?=\s+\S)/g) || []).length,
      0,
      `${line.id} has more than one punchline line`,
    );
  }
  for (const line of pool.lines.filter(({ kind }) => kind === "joke")) {
    assert.deepEqual(
      Object.keys(line).sort(),
      ["id", "kind", "sub", "text"],
      `${line.id} carries chapter state`,
    );
  }
  for (const line of lines.filter(({ kind }) => kind === "fact")) {
    assert.ok(line.sub, `${line.id} has no reveal`);
  }
});

test("the pool mixes its kinds instead of serving one kind at a time", () => {
  let seen = [];
  const kinds = [];
  for (let index = 0; index < 6; index += 1) {
    const line = selectLine(pool, seen);
    kinds.push(line.kind);
    seen = rememberLine(seen, line.id);
  }
  // No kind twice in a row, and more than one kind in the first six.
  assert.ok(new Set(kinds).size > 1, `only served ${kinds.join(", ")}`);
  for (let index = 1; index < kinds.length; index += 1) {
    assert.notEqual(kinds[index], kinds[index - 1], kinds.join(", "));
  }
});

test("a line never repeats while anything else is unread", () => {
  const lines = normalizeLinePool(pool);
  let seen = [];
  const shown = [];
  for (let index = 0; index < Math.min(lines.length, LINE_MEMORY); index += 1) {
    const line = selectLine(pool, seen);
    shown.push(line.id);
    seen = rememberLine(seen, line.id);
  }
  assert.equal(new Set(shown).size, shown.length, "a line was repeated early");
});

test("the pool is a rotation, not a wall: it always gives something", () => {
  let seen = [];
  for (let index = 0; index < 200; index += 1) {
    const line = selectLine(pool, seen);
    assert.ok(line, `ran dry after ${index} reads`);
    seen = rememberLine(seen, line.id);
  }
  assert.ok(seen.length <= LINE_MEMORY, "memory is capped");
});

test("an empty pool gives nothing rather than throwing", () => {
  assert.equal(selectLine([], []), null);
  assert.equal(selectLine(undefined, []), null);
});

test("two devices that read different lines remember both", () => {
  const phone = ["a", "b"];
  const laptop = ["c", "d"];
  const merged = mergeSeenLines(phone, laptop);
  for (const id of [...phone, ...laptop]) assert.ok(merged.includes(id), id);
});
