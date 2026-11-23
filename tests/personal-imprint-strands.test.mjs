import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_STRAND_LENGTH, STRAND_STEPS, coloredStrandLength, strandFinishDay, strandPaint, strandSchedule } from '../app/os/home/imprint-strand-growth.js';
import { decodeStrandMap, encodeStrandMap, renderStrandFrame, strandGroupIndices } from '../app/os/home/imprint-strand-raster.js';

const groups = { starting: [], notes: [{ id: 0, length: 5300 }, { id: 1, length: 5600 }, { id: 2, length: 5700 }],
  thoughts: [], routine: [{ id: 3, length: 5400 }], 'log-week': [], protocol: [] };
const dayMs = 86_400_000;
const first = Date.parse('2025-01-01T08:00:00Z');
const day = (index, sources, group = 'notes') => {
  const at = new Date(first + index * dayMs).toISOString();
  return { at, day: at.slice(0, 10), fadeAt: first + (index + 2) * dayMs, group, sources };
};

test('nearby strands start one at a time and the same lengths slow after day fourteen', () => {
  const { notes } = groups;
  const rates = strandSchedule(notes, 366);
  const lengths = count => notes.map(({ length }, i) => coloredStrandLength(length, i + 1, count, rates));
  assert.deepEqual(lengths(1), [FIRST_STRAND_LENGTH, 0, 0]);
  assert.deepEqual(lengths(2), [FIRST_STRAND_LENGTH + rates.early, FIRST_STRAND_LENGTH, 0]);
  assert.ok(lengths(3)[0] > lengths(3)[1]);
  assert.equal(lengths(3)[2], FIRST_STRAND_LENGTH);
  assert.ok(Math.abs(lengths(14)[0] - lengths(13)[0] - rates.early) < 1e-9);
  assert.ok(Math.abs(lengths(15)[0] - lengths(14)[0] - rates.slow) < 1e-9);
  assert.ok(rates.slow / rates.early > .58 && rates.slow / rates.early < .60);
});

test('full color takes the whole year, including an intervening leap day', () => {
  assert.equal(strandFinishDay('2025-01-01'), 366);
  assert.equal(strandFinishDay('2023-03-01'), 367);
  assert.equal(strandFinishDay('2024-02-29'), 367);
  for (const finish of [366, 367]) {
    const rates = strandSchedule(groups.notes, finish);
    const full = count => groups.notes.every(({ length }, i) => coloredStrandLength(length, i + 1, count, rates) >= length - 1e-5);
    assert.equal(full(finish - 1), false);
    assert.equal(full(finish), true);
  }
});

test('saved dates deduplicate growth and keep fresh color, corrections and pulses local to their sources', () => {
  const notes = day(0, ['one', 'two']);
  const routine = day(1, ['habit:one'], 'routine');
  const duplicate = { ...notes, sources: ['three'] };
  const both = strandPaint(groups, [notes, routine, duplicate], first + dayMs);
  assert.equal(both.coverage[0], 255);
  assert.equal(both.coverage[STRAND_STEPS], 0, 'a second contribution on the same day starts no second strand');
  assert.equal(both.coverage[3 * STRAND_STEPS], 255);
  const before = strandPaint(groups, [notes, routine], first + dayMs, new Set(['two', 'habit:one']));
  assert.equal(before.coverage[0], 255, 'another same-day Note supports that length');
  assert.equal(before.coverage[3 * STRAND_STEPS], 0);
  assert.equal(before.fresh[0], 1);
  const aged = strandPaint(groups, [notes], notes.fadeAt);
  assert.equal(aged.fresh[0], 0);
  assert.deepEqual(aged.coverage, before.coverage);
  assert.equal(strandPaint(groups, [{ ...notes, sources: [] }], first).hasColor, false);
  assert.equal(strandPaint(groups, [routine], first).hasColor, false);
});

test('packed coverage round-trips and Bone appears only when both neighbors have reached it', () => {
  const packed = Uint32Array.from([3, 1, 1, 1, 2, 0, STRAND_STEPS | (90 << 20), 0x376be3,
    1, 0, STRAND_STEPS, 175]);
  const bytes = encodeStrandMap(packed);
  const map = decodeStrandMap(bytes.buffer, 3, 1);
  assert.deepEqual([...map.orange, ...map.bone], [...packed.subarray(4)]);
  assert.throws(() => decodeStrandMap(bytes.buffer, 2, 1), /incomplete/);
  const base = Uint8ClampedArray.from([25, 24, 19, 255, 25, 24, 19, 255, 230, 225, 219, 255]);
  const indices = strandGroupIndices(groups);
  const firstDay = strandPaint(groups, [day(0, ['one'])], first);
  const secondDay = strandPaint(groups, [day(0, ['one']), day(1, ['two'])], first + dayMs);
  assert.deepEqual([...renderStrandFrame(base, map, firstDay, indices).slice(4, 8)], [...base.slice(4, 8)]);
  assert.ok(renderStrandFrame(base, map, secondDay, indices)[4] > 100);
});
