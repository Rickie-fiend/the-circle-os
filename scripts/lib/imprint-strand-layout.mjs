import { COLOR_GROUPS } from '../../app/os/home/imprint-color-model.js';
import { FIRST_STRAND_LENGTH, STRAND_COUNT, STRAND_STEPS } from '../../app/os/home/imprint-strand-growth.js';

export const PHONE_WIDTH = 390;
export const PHONE_HEIGHT = 585;
export const COURSE_BINS = 768;
const wrap = value => value - Math.floor(value);
const courseDistance = (a, b) => Math.abs(a - b - Math.round(a - b));

export function visibleCourses(coordinates) {
  const courses = Array.from({ length: STRAND_COUNT }, () => new Float32Array(COURSE_BINS * 3));
  for (let pixel = 0; pixel < PHONE_WIDTH * PHONE_HEIGHT; pixel++) {
    if (!coordinates[pixel * 3]) continue;
    const owner = Math.round(coordinates[pixel * 3 + 2] * STRAND_COUNT);
    const bin = Math.min(COURSE_BINS - 1, Math.floor(coordinates[pixel * 3 + 1] * COURSE_BINS));
    const course = courses[owner];
    course[bin * 3] += pixel % PHONE_WIDTH + .5;
    course[bin * 3 + 1] += Math.floor(pixel / PHONE_WIDTH) + .5;
    course[bin * 3 + 2]++;
  }
  return courses;
}

export function visibleBends(scene) {
  const courses = Array.from({ length: STRAND_COUNT }, () => new Float32Array(COURSE_BINS * 3));
  const clarity = Array.from({ length: STRAND_COUNT }, () => new Float32Array(COURSE_BINS));
  const scale = PHONE_WIDTH / scene.width;
  const area = scale * scale;
  for (let pixel = 0; pixel < scene.strandOwner.length; pixel++) {
    const owner = scene.strandOwner[pixel];
    if (owner < 0) continue;
    const light = scene.rgba[pixel * 4];
    if (light < 28) continue;
    const bin = Math.min(COURSE_BINS - 1, Math.floor(scene.coursePosition[pixel] * COURSE_BINS));
    const course = courses[owner];
    course[bin * 3] += (pixel % scene.width + .5) * scale;
    course[bin * 3 + 1] += (Math.floor(pixel / scene.width) + .5) * scale;
    course[bin * 3 + 2]++;
    clarity[owner][bin] += area * Math.max(0, Math.min(1.5, (light - 28) / 48));
  }
  return { courses, clarity };
}

function strandDistances(geometry, settings) {
  const scale = PHONE_WIDTH / settings.width;
  return geometry.strands.map(({ route }) => {
    const distances = new Float64Array(route.length);
    for (let i = 1; i < route.length; i++) {
      const [x, y, z] = route[i];
      const [px, py, pz] = route[i - 1];
      distances[i] = distances[i - 1] + scale * Math.hypot(x - px, y - py, (z - pz) * settings.surface.depthScale);
    }
    return distances;
  });
}

function assignGroups(anchors) {
  const seed = Math.round(anchors.notes.u * STRAND_COUNT) - 10;
  const blocks = COLOR_GROUPS.map((_, index) => {
    const start = Math.ceil(index * STRAND_COUNT / COLOR_GROUPS.length);
    const end = Math.ceil((index + 1) * STRAND_COUNT / COLOR_GROUPS.length);
    return Array.from({ length: end - start }, (_, offset) => (seed + start + offset + STRAND_COUNT) % STRAND_COUNT);
  });
  const labels = COLOR_GROUPS.filter(group => group !== 'notes');
  let bestCost = Infinity;
  let best;
  function assign(index, used, cost, result) {
    if (cost >= bestCost) return;
    if (index === labels.length) {
      bestCost = cost;
      best = result;
      return;
    }
    const group = labels[index];
    for (let block = 1; block < blocks.length; block++) {
      if (used.includes(block)) continue;
      const center = blocks[block][Math.floor(blocks[block].length / 2)] / STRAND_COUNT;
      assign(index + 1, [...used, block], cost + courseDistance(anchors[group].u, center), { ...result, [group]: blocks[block] });
    }
  }
  assign(0, [], 0, { notes: blocks[0] });
  return best;
}

function bendAt(route, course) {
  const last = route.length - 1;
  const center = Math.round(course * last) % last;
  const a = route[(center + last - 30) % last], b = route[center], c = route[(center + 30) % last];
  const x = b[0] - a[0], y = b[1] - a[1], u = c[0] - b[0], v = c[1] - b[1];
  return Math.min(1, Math.abs(Math.atan2(x * v - y * u, x * u + y * v)));
}

export function createStrandLayout(geometry, settings, anchors, courses, clarity) {
  const distances = strandDistances(geometry, settings);
  const blocks = assignGroups(anchors);
  const groups = {};
  const centers = new Float64Array(STRAND_COUNT);
  const locations = {};
  const used = [];
  for (const name of ['notes', ...COLOR_GROUPS.filter(group => group !== 'notes')]) {
    const block = blocks[name];
    const anchor = anchors[name];
    const target = wrap(anchor.t + (name === 'notes' ? .02 : 0));
    let best;
    let highestVisibility = 0;
    for (const [index, owner] of block.entries()) {
      const course = courses[owner];
      for (let bin = 0; bin < COURSE_BINS; bin++) {
        if (!course[bin * 3 + 2]) continue;
        const position = (bin + .5) / COURSE_BINS;
        const x = course[bin * 3] / course[bin * 3 + 2];
        const y = course[bin * 3 + 1] / course[bin * 3 + 2];
        const visible = visibleLength(clarity[owner], distances[owner], bin);
        highestVisibility = Math.max(highestVisibility, visible);
        if (visible < 3) continue;
        const neighbor = Math.max(
          index > 0 ? visibleLength(clarity[block[index - 1]], distances[block[index - 1]], bin) : 0,
          index + 1 < block.length ? visibleLength(clarity[block[index + 1]], distances[block[index + 1]], bin) : 0,
        );
        const nearby = used.reduce((cost, point) => cost + Math.max(0, 40 - Math.hypot(x - point.x, y - point.y)), 0);
        const score = Math.min(visible, 70) * 4.2 + Math.min(neighbor, 35) * 1.1 +
          bendAt(geometry.strands[owner].route, position) * 11 - courseDistance(position, target) * 55 - nearby;
        if (!best || score > best.score) best = { index, bin, position, x, y, score, visible };
      }
    }
    if (!best) throw Error(`No visible first strand for ${name} (best: ${highestVisibility.toFixed(1)}).`);
    used.push(best);
    locations[name] = { x: best.x, y: best.y };
    const order = [block[best.index]];
    let left = best.index - 1, right = best.index + 1;
    while (order.length < block.length) {
      const leftCount = left >= 0 ? visibleLength(clarity[block[left]], distances[block[left]], best.bin) : -1;
      const rightCount = right < block.length ? visibleLength(clarity[block[right]], distances[block[right]], best.bin) : -1;
      order.push(leftCount > rightCount ? block[left--] : block[right++]);
    }
    groups[name] = order.map(id => {
      const distance = distances[id];
      centers[id] = distance[Math.round(best.position * (distance.length - 1))];
      return { id, length: Math.round(distance.at(-1) * 100) / 100 };
    });
  }
  const keys = distances.map((distance, owner) => Uint32Array.from(distance, value => {
    const around = Math.abs(value - centers[owner]);
    const length = distance.at(-1);
    const offset = Math.min(around, length - around);
    return owner * STRAND_STEPS + Math.round((STRAND_STEPS - 1) * 2 * offset / length);
  }));
  return { groups, locations, keys };
}

function visibleLength(clarity, distances, bin) {
  const length = distances.at(-1);
  const last = distances.length - 1;
  const center = distances[Math.round((bin + .5) / COURSE_BINS * last)];
  let count = 0;
  for (let delta = -15; delta <= 15; delta++) {
    const t = (bin + delta + COURSE_BINS) % COURSE_BINS;
    const around = Math.abs(distances[Math.round((t + .5) / COURSE_BINS * last)] - center);
    if (Math.min(around, length - around) <= FIRST_STRAND_LENGTH / 2) count += clarity[t];
  }
  return count;
}
