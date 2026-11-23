import { COLOR_GROUPS } from './imprint-color-model.js';

export const STRAND_COUNT = 128;
export const STRAND_STEPS = 4096;
export const FIRST_STRAND_LENGTH = 58;
export const SLOW_AFTER_DAY = 14;
const EARLY_RATE_RATIO = 1.7;
const TIP_LENGTH = 3;
const DAY_MS = 86_400_000;

// Day one counts as a qualifying day. Respect the calendar anniversary even
// when it spans an extra February day, using the original attributed dates.
export function strandFinishDay(firstDay) {
  const first = new Date(`${firstDay}T00:00:00Z`);
  const anniversary = new Date(first);
  anniversary.setUTCFullYear(first.getUTCFullYear() + 1);
  return Math.max(366, 1 + Math.round((anniversary - first) / DAY_MS));
}

export function strandSchedule(strands, finishDay) {
  // The limiting strand finishes exactly on the target day. All strands use
  // the same extensions, so earlier starts lead until they reach their ends.
  const slow = Math.max(...strands.map(({ length }, index) => {
    const start = index + 1;
    const early = Math.max(0, SLOW_AFTER_DAY - start);
    const late = finishDay - Math.max(SLOW_AFTER_DAY, start);
    return Math.max(0, length - FIRST_STRAND_LENGTH) / (early * EARLY_RATE_RATIO + late);
  }));
  return { early: slow * EARLY_RATE_RATIO, slow };
}

export function coloredStrandLength(length, start, day, rates) {
  if (day < start) return 0;
  const early = Math.max(0, Math.min(day, SLOW_AFTER_DAY) - start);
  const late = Math.max(0, day - Math.max(SLOW_AFTER_DAY, start));
  return Math.min(length, FIRST_STRAND_LENGTH + early * rates.early + late * rates.slow);
}

function firstColorDay(distance, start, rates) {
  const remaining = distance * 2 - FIRST_STRAND_LENGTH;
  if (remaining <= 0) return start;
  const early = Math.max(0, SLOW_AFTER_DAY - start);
  const earlyLength = early * rates.early;
  if (remaining <= earlyLength) return start + Math.ceil(remaining / rates.early);
  return start + early + Math.ceil((remaining - earlyLength) / rates.slow);
}

const smooth = value => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};

export function strandPaint(groups, days, now, excludedSources = new Set()) {
  const byGroup = new Map(COLOR_GROUPS.map(group => [group, new Map()]));
  for (const day of days) {
    if (!(Date.parse(day.at) <= now) || !day.sources.some(source => !excludedSources.has(source))) continue;
    const group = byGroup.get(day.group);
    if (!group) continue;
    const previous = group.get(day.day);
    if (!previous || day.at < previous.at) group.set(day.day, day);
  }
  const coverage = new Uint8Array(STRAND_COUNT * STRAND_STEPS);
  const fresh = new Uint8Array(coverage.length);
  let hasColor = false;
  for (const group of COLOR_GROUPS) {
    const active = [...byGroup.get(group).values()].sort((a, b) => a.at.localeCompare(b.at) || a.day.localeCompare(b.day));
    if (!active.length) continue;
    const strands = groups[group];
    const finish = strandFinishDay(active[0].day);
    const rates = strandSchedule(strands, finish);
    const brightness = active.map(day => now < day.fadeAt);
    for (const [index, strand] of strands.entries()) {
      const start = index + 1;
      const length = coloredStrandLength(strand.length, start, active.length, rates);
      if (!length) break;
      hasColor = true;
      const full = length >= strand.length - 1e-5;
      const mooring = strand.id * STRAND_STEPS;
      for (let step = 0; step < STRAND_STEPS; step++) {
        const distance = step / (STRAND_STEPS - 1) * strand.length / 2;
        if (!full && distance >= length / 2) break;
        coverage[mooring + step] = full ? 255 : Math.round(255 * smooth((length / 2 - distance) / TIP_LENGTH));
        const day = Math.min(active.length, firstColorDay(distance, start, rates));
        if (brightness[day - 1]) fresh[mooring + step] = 1;
      }
    }
  }
  return { coverage, fresh, hasColor };
}
