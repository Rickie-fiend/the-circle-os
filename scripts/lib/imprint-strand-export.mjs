import sharp from 'sharp';
import { INK, ORANGE } from '../../app/os/home/imprint-strand-raster.js';
import { COURSE_BINS, PHONE_HEIGHT, PHONE_WIDTH } from './imprint-strand-layout.mjs';

const smooth = value => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};
const clamp = (value, last) => Math.max(0, Math.min(last, value));

function densityByPosition(coordinates) {
  const stride = PHONE_WIDTH + 1;
  const sums = new Uint32Array(stride * (PHONE_HEIGHT + 1));
  for (let y = 0; y < PHONE_HEIGHT; y++) {
    let row = 0;
    for (let x = 0; x < PHONE_WIDTH; x++) {
      row += coordinates[(y * PHONE_WIDTH + x) * 3] > 0 ? 1 : 0;
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
  const coverage = (x, y, radius) => {
    const left = clamp(x - radius, PHONE_WIDTH), right = clamp(x + radius + 1, PHONE_WIDTH);
    const top = clamp(y - radius, PHONE_HEIGHT), bottom = clamp(y + radius + 1, PHONE_HEIGHT);
    const count = sums[bottom * stride + right] - sums[top * stride + right] - sums[bottom * stride + left] + sums[top * stride + left];
    return count / ((right - left) * (bottom - top));
  };
  const pressure = new Float32Array(PHONE_WIDTH * PHONE_HEIGHT);
  for (let y = 0; y < PHONE_HEIGHT; y++) for (let x = 0; x < PHONE_WIDTH; x++) {
    pressure[y * PHONE_WIDTH + x] = smooth((.62 * coverage(x, y, 2) + .38 * coverage(x, y, 6) - .37) / .40);
  }
  return pressure;
}

function orangeAt(base, width, height, x, y, pressure) {
  const pixel = y * width + x;
  const center = base[pixel * 4] - INK[0];
  const fx = clamp((x + .5) * PHONE_WIDTH / width - .5, PHONE_WIDTH - 1);
  const fy = clamp((y + .5) * PHONE_HEIGHT / height - .5, PHONE_HEIGHT - 1);
  const left = Math.floor(fx), right = Math.min(left + 1, PHONE_WIDTH - 1);
  const top = Math.floor(fy), bottom = Math.min(top + 1, PHONE_HEIGHT - 1);
  const ax = fx - left, ay = fy - top;
  const topPressure = pressure[top * PHONE_WIDTH + left] * (1 - ax) + pressure[top * PHONE_WIDTH + right] * ax;
  const bottomPressure = pressure[bottom * PHONE_WIDTH + left] * (1 - ax) + pressure[bottom * PHONE_WIDTH + right] * ax;
  const crowded = topPressure * (1 - ay) + bottomPressure * ay;
  let ridge = center;
  if (crowded > .005) {
    const reach = Math.max(1, Math.round(2 * width / 1024));
    for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) {
      if (dx * dx + dy * dy > reach * reach + 1) continue;
      const sx = clamp(x + dx, width - 1), sy = clamp(y + dy, height - 1);
      ridge = Math.max(ridge, base[(sy * width + sx) * 4] - INK[0]);
    }
  }
  // The selected middle study trims coverage at the sides of crowded strands.
  // The ridge retains the approved Orange and relief shading.
  const area = 1 - crowded * .54 * (1 - smooth((center / ridge - .40) / .58));
  const light = (center / 216) ** .43 * area;
  return ORANGE.reduce((packed, pigment, c) => packed | (Math.round(INK[c] + (pigment - INK[c]) * light) << (8 * c)), 0);
}

function orangeRecords(scene, base, width, height, pressure, keys) {
  const records = new Uint32Array(width * height * 4);
  const occurrences = new Uint8Array(keys.length), sums = new Uint32Array(keys.length);
  const owners = new Uint8Array(keys.length);
  const sx = scene.width / width, sy = scene.height / height;
  let count = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    if (base[index * 4] <= INK[0]) continue;
    const left = Math.floor(x * sx), right = Math.min(scene.width, Math.ceil((x + 1) * sx));
    const top = Math.floor(y * sy), bottom = Math.min(scene.height, Math.ceil((y + 1) * sy));
    let used = 0;
    for (let row = top; row < bottom; row++) for (let col = left; col < right; col++) {
      const pixel = row * scene.width + col;
      const owner = scene.strandOwner[pixel];
      if (owner < 0) continue;
      if (!occurrences[owner]) owners[used++] = owner;
      occurrences[owner]++;
      const strand = keys[owner];
      sums[owner] += strand[clamp(Math.round(scene.coursePosition[pixel] * (strand.length - 1)), strand.length - 1)];
    }
    if (!used) continue;
    let first = owners[0], second = -1;
    for (let i = 1; i < used; i++) {
      const owner = owners[i];
      if (occurrences[owner] > occurrences[first]) { second = first; first = owner; }
      else if (second < 0 || occurrences[owner] > occurrences[second]) second = owner;
    }
    const primary = Math.round(sums[first] / occurrences[first]);
    const share = second < 0 ? 0 : Math.round(255 * occurrences[second] / (occurrences[first] + occurrences[second]));
    const companion = second < 0 ? 0 : Math.round(sums[second] / occurrences[second]);
    records[count++] = index;
    records[count++] = primary;
    records[count++] = companion | (share << 20);
    records[count++] = orangeAt(base, width, height, x, y, pressure);
    for (let i = 0; i < used; i++) { occurrences[owners[i]] = 0; sums[owners[i]] = 0; }
  }
  return records.subarray(0, count);
}

function boneRecords(base, width, height, courses, keys) {
  const scale = width / PHONE_WIDTH;
  const opacity = new Uint8Array(width * height);
  const firstKey = new Uint32Array(opacity.length), secondKey = new Uint32Array(opacity.length);
  const light = (x, y) => Math.max(0, (base[(Math.floor(y * scale) * width + Math.floor(x * scale)) * 4] - INK[0]) / 216);
  for (let owner = 1; owner < courses.length - 1; owner += 2) {
    const left = courses[owner], right = courses[owner + 1];
    const runs = [];
    let run = [];
    for (let bin = 0; bin < COURSE_BINS; bin++) {
      const i = bin * 3;
      if (!left[i + 2] || !right[i + 2]) continue;
      const ax = left[i] / left[i + 2], ay = left[i + 1] / left[i + 2];
      const bx = right[i] / right[i + 2], by = right[i + 1] / right[i + 2];
      const spacing = Math.hypot(bx - ax, by - ay);
      const brightness = (light(ax, ay) + light(bx, by)) / 2;
      if (spacing < 1.22 || spacing > 4.25 || brightness < .037) continue;
      const point = { x: (ax + bx) / 2, y: (ay + by) / 2, bin, shine: .34 + .52 * Math.sqrt(brightness) };
      const previous = run.at(-1);
      if (previous && (bin - previous.bin > 3 || Math.hypot(point.x - previous.x, point.y - previous.y) > 7.5)) {
        if (run.length >= 4) runs.push(run);
        run = [];
      }
      run.push(point);
    }
    if (run.length >= 4) runs.push(run);
    for (const points of runs) for (let j = 1; j < points.length; j++) {
      const a = points[j - 1], b = points[j];
      const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
      if (squared < .001) continue;
      const x0 = clamp(Math.floor(Math.min(a.x, b.x) * scale - 2), width - 1);
      const x1 = clamp(Math.ceil(Math.max(a.x, b.x) * scale + 2), width - 1);
      const y0 = clamp(Math.floor(Math.min(a.y, b.y) * scale - 2), height - 1);
      const y1 = clamp(Math.ceil(Math.max(a.y, b.y) * scale + 2), height - 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const tx = (x + .5) / scale - a.x, ty = (y + .5) / scale - a.y;
        const q = clamp((tx * dx + ty * dy) / squared, 1);
        const distance = Math.hypot(tx - dx * q, ty - dy * q);
        const tip = smooth((j - 1 + q) / 2) * smooth((points.length - j - q) / 2);
        const pixel = y * width + x;
        const gap = 1 - smooth((base[pixel * 4] - INK[0]) / 24);
        const amount = Math.round(255 * gap * tip * smooth((.57 - distance) / .33) * (a.shine + (b.shine - a.shine) * q));
        if (amount <= opacity[pixel]) continue;
        const course = (a.bin + .5 + (b.bin - a.bin) * q) / COURSE_BINS;
        firstKey[pixel] = keys[owner][Math.round(course * (keys[owner].length - 1))];
        secondKey[pixel] = keys[owner + 1][Math.round(course * (keys[owner + 1].length - 1))];
        opacity[pixel] = amount;
      }
    }
  }
  let count = 0;
  for (const value of opacity) if (value) count++;
  const records = new Uint32Array(count * 4);
  let cursor = 0;
  for (let pixel = 0; pixel < opacity.length; pixel++) {
    if (!opacity[pixel]) continue;
    records[cursor++] = pixel;
    records[cursor++] = firstKey[pixel];
    records[cursor++] = secondKey[pixel];
    records[cursor++] = opacity[pixel];
  }
  return records;
}

export async function exportStrands(scene, width, coordinates, courses, keys) {
  const height = width * 3 / 2;
  const base = await sharp(scene.rgba, { raw: { width: scene.width, height: scene.height, channels: 4 } })
    .resize({ width, kernel: 'linear' }).raw().toBuffer();
  const orange = orangeRecords(scene, base, width, height, densityByPosition(coordinates), keys);
  const bone = boneRecords(base, width, height, courses, keys);
  const packed = new Uint32Array(4 + orange.length + bone.length);
  packed.set([width, height, orange.length / 4, bone.length / 4]);
  packed.set(orange, 4);
  packed.set(bone, 4 + orange.length);
  const artwork = await sharp(base, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toBuffer();
  return { width, height, base, artwork, packed };
}
