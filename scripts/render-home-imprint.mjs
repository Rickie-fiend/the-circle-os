import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import sharp from 'sharp';
import { COLOR_GROUPS } from '../app/os/home/imprint-color-model.js';
import { strandPaint } from '../app/os/home/imprint-strand-growth.js';
import { encodeStrandMap, renderStrandFrame, strandGroupIndices } from '../app/os/home/imprint-strand-raster.js';
import { createReliefGeometry } from './lib/imprint-relief-geometry.mjs';
import { renderImprintMaterial } from './lib/imprint-material-renderer.mjs';
import { createStrandLayout, visibleBends, visibleCourses } from './lib/imprint-strand-layout.mjs';
import { exportStrands } from './lib/imprint-strand-export.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const design = 'docs/design', output = 'outputs/imprint/strands';
const stamp = Date.UTC(2025, 0, 1, 8);
const dayMs = 86_400_000;
const inspection = JSON.parse(await readFile(`${design}/personal-imprint-generator-v1-inspection.json`, 'utf8'));
const growth = JSON.parse(await readFile(`${design}/personal-imprint-growth-v1.json`, 'utf8'));
const sources = ['sori', ...(process.argv.includes('--review') ? ['mira', 'arun', 'lin', 'noor', 'tala'] : [])];
await mkdir(output, { recursive: true });

async function saveAssets(art, prefix) {
  const assets = { width: art.width, height: art.height };
  for (const [kind, bytes, extension, type] of [
    ['bone', art.artwork, 'webp', 'image/webp'],
    ['coordinates', gzipSync(encodeStrandMap(art.packed)), 'bin.gz', 'application/gzip'],
  ]) {
    const path = `${kind}-strands-${art.width}`;
    const file = `personal-imprint-home-${prefix}-${path}.${extension}`;
    await writeFile(`${design}/${file}`, bytes);
    assets[kind] = { path: `os/home/imprint-art/${path}`, file, hash: hash(bytes), type };
    console.log(`${file}: ${bytes.length} bytes`);
  }
  return assets;
}

function exampleDays(groups, count) {
  return Array.from({ length: count }, (_, index) => {
    const at = new Date(stamp + index * dayMs).toISOString();
    return groups.map(group => ({ group, day: at.slice(0, 10), at, fadeAt: stamp + (index + 2) * dayMs,
      sources: [`${group}-${index}`] }));
  }).flat();
}

async function reviewArt(source, art, layout) {
  const base = new Uint8ClampedArray(art.base.buffer, art.base.byteOffset, art.base.byteLength);
  const orangeEnd = 4 + art.packed[2] * 4;
  const map = { orange: art.packed.subarray(4, orangeEnd), bone: art.packed.subarray(orangeEnd) };
  const indices = strandGroupIndices(layout.groups);
  const stages = [...COLOR_GROUPS.map(group => [`day-1-${group}`, [group], 1]),
    ['day-14', ['notes'], 14], ['day-15', ['notes'], 15], ['day-30', ['notes'], 30], ['year-one', COLOR_GROUPS, 366]];
  const results = {};
  for (const [label, groups, count] of stages) {
    const now = stamp + (count - 1) * dayMs;
    const state = strandPaint(layout.groups, exampleDays(groups, count), now);
    const painted = renderStrandFrame(base, map, state, indices, count === 1 ? new Set(groups) : new Set());
    let orangePixels = 0;
    for (let pixel = 0; pixel < painted.length; pixel += 4) {
      const color = painted[pixel] - painted[pixel + 1];
      if (color > 25 && color - (base[pixel] - base[pixel + 1]) > 18) orangePixels++;
    }
    results[label] = orangePixels;
    if (orangePixels < 90) throw Error(`${source.id}: ${label} has too little visible Orange (${orangePixels} pixels).`);
    await sharp(painted, { raw: { width: art.width, height: art.height, channels: 4 } })
      .resize({ width: 390 }).png().toFile(`${output}/${source.id}-${label}.png`);
  }
  console.log(source.label, results);
  return { id: source.id, label: source.label, locations: layout.locations, visiblePixels: results };
}

async function render(sourceId) {
  const source = inspection.samples.find(sample => sample.id === sourceId);
  const anchors = growth.samples.find(sample => sample.id === sourceId).anchors;
  if (hash(await readFile(source.outputs.full.path)) !== source.renderHash) throw Error('The accepted master has changed.');
  const path = `${design}/personal-imprint-color-v1-${sourceId}-coordinates.bin`;
  const raw = await readFile(path);
  const coordinates = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const courses = visibleCourses(coordinates);
  const geometry = createReliefGeometry(source.recipe, source.steps);
  let scene;
  const rendered = await renderImprintMaterial({ geometry, settings: inspection.settings,
    base: `${output}/${sourceId}`, capture: material => { scene = material; } });
  if (rendered.renderHash !== source.renderHash) throw Error('The rendered master has changed.');
  const bends = visibleBends(scene);
  const layout = createStrandLayout(geometry, inspection.settings, anchors, bends.courses, bends.clarity);
  const art = await exportStrands(scene, 1170, coordinates, courses, layout.keys);
  if (sourceId === 'sori') {
    const variants = [await saveAssets(art, sourceId)];
    variants.push(await saveAssets(await exportStrands(scene, 390, coordinates, courses, layout.keys), sourceId));
    await writeFile('app/os/home/imprint-art-variants.json', `${JSON.stringify(variants, null, 2)}\n`);
    await writeFile('app/os/home/imprint-strand-layout.json', `${JSON.stringify(layout.groups, null, 2)}\n`);
  }
  return reviewArt(source, art, layout);
}

const results = [];
for (const sourceId of sources) results.push(await render(sourceId));
await writeFile(`${output}/inspection.json`, `${JSON.stringify(results, null, 2)}\n`);
