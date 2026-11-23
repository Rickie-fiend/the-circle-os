import { COLOR_GROUPS } from './imprint-color-model.js';
import { STRAND_COUNT, STRAND_STEPS } from './imprint-strand-growth.js';

export const STRAND_KEY_MASK = (1 << 20) - 1;
export const INK = [25, 24, 19];
export const BONE = [241, 239, 232];
export const ORANGE = [227, 107, 55];
const FRESH_LIFT = .12;
const PULSE_LIFT = .22;

// The transfer layout puts like bytes next to each other for compression.
// The decoded records stay together for painting. Pixel positions are deltas.
export function encodeStrandMap(words) {
  const bytes = new Uint8Array(words.byteLength);
  new Uint32Array(bytes.buffer, 0, 4).set(words.subarray(0, 4));
  let from = 4, to = 16;
  for (const count of [words[2], words[3]]) {
    for (let field = 0; field < 4; field++) for (let lane = 0; lane < 4; lane++) {
      let prior = 0;
      for (let i = 0; i < count; i++) {
        const value = words[from + i * 4 + field];
        bytes[to++] = ((field === 0 ? value - prior : value) >>> (8 * lane)) & 255;
        prior = value;
      }
    }
    from += count * 4;
  }
  return bytes;
}

export function decodeStrandMap(bytes, width, height) {
  if (bytes.byteLength < 16) throw Error('Artwork coordinates are incomplete.');
  const [mapWidth, mapHeight, orangeCount, boneCount] = new Uint32Array(bytes, 0, 4);
  if (mapWidth !== width || mapHeight !== height || bytes.byteLength !== 16 + 16 * (orangeCount + boneCount)) {
    throw Error('Artwork coordinates are incomplete.');
  }
  const encoded = new Uint8Array(bytes);
  let cursor = 16;
  const [orange, bone] = [orangeCount, boneCount].map(count => {
    const records = new Uint32Array(count * 4);
    for (let field = 0; field < 4; field++) for (let lane = 0; lane < 4; lane++) {
      for (let i = field; i < records.length; i += 4) records[i] |= encoded[cursor++] << (8 * lane);
    }
    for (let i = 4; i < records.length; i += 4) records[i] += records[i - 4];
    return records;
  });
  return { orange, bone };
}

export function strandGroupIndices(groups) {
  const indices = new Uint8Array(STRAND_COUNT);
  for (const [index, group] of COLOR_GROUPS.entries()) {
    for (const { id } of groups[group]) indices[id] = index;
  }
  return indices;
}

export function renderStrandFrame(base, map, state, groupIndices, pulsing = new Set()) {
  const pixels = new Uint8ClampedArray(base);
  if (!state.hasColor) return pixels;
  const { coverage, fresh } = state;
  const { orange, bone } = map;
  const liftByStrand = new Float32Array(STRAND_COUNT);
  for (let strand = 0; strand < STRAND_COUNT; strand++) {
    if (pulsing.has(COLOR_GROUPS[groupIndices[strand]])) liftByStrand[strand] = PULSE_LIFT;
  }
  for (let i = 0; i < orange.length; i += 4) {
    const index = orange[i] * 4;
    const primary = orange[i + 1];
    const secondary = orange[i + 2] & STRAND_KEY_MASK;
    const share = (orange[i + 2] >>> 20) / 255;
    const first = coverage[primary] * (1 - share) / 255;
    const second = coverage[secondary] * share / 255;
    const amount = first + second;
    if (!amount) continue;
    const lift = first * (fresh[primary] * FRESH_LIFT + liftByStrand[primary / STRAND_STEPS | 0]) +
      second * (fresh[secondary] * FRESH_LIFT + liftByStrand[secondary / STRAND_STEPS | 0]);
    const pigment = orange[i + 3];
    for (let c = 0; c < 3; c++) {
      const color = (pigment >>> (c * 8)) & 255;
      pixels[index + c] = base[index + c] * (1 - amount) + color * amount + Math.max(0, color - INK[c]) * lift;
    }
  }
  for (let i = 0; i < bone.length; i += 4) {
    const index = bone[i] * 4;
    const neighbors = Math.min(coverage[bone[i + 1]], coverage[bone[i + 2]]);
    if (!neighbors) continue;
    const amount = neighbors * bone[i + 3] / (255 * 255);
    for (let c = 0; c < 3; c++) pixels[index + c] += (BONE[c] - pixels[index + c]) * amount;
  }
  return pixels;
}
