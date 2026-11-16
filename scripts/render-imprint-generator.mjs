import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { createReliefImprintRecipe } from "../app/os/home/imprint-relief-recipe.js";
import { reliefImprintSamples } from "../app/os/home/imprint-relief-samples.js";
import { buildCheckedReliefGeometry } from "./lib/imprint-relief-inspection.mjs";
import { renderImprintMaterial } from "./lib/imprint-material-renderer.mjs";
import { rasterDepth } from "./lib/imprint-network-geometry.mjs";
import { generatorBase as base, artifactHash as hash, generatorSourceHashes, preservedSoriReference } from "./lib/imprint-generator-artifacts.mjs";

await mkdir("outputs/imprint", { recursive: true });
const settings = JSON.parse(await readFile("docs/design/personal-imprint-loops-v2.json", "utf8"));
const report = { version: 1, status: "rendering", readyForReview: false, settings,
  sourceHashes: await generatorSourceHashes(), approvedReference: await preservedSoriReference(), samples: [] };
const save = () => writeFile(`${base}-inspection.json`, JSON.stringify(report, null, 2) + "\n");
await save();
for (const sample of reliefImprintSamples) {
  const recipe = await createReliefImprintRecipe(sample.input), { geometry, checked, attempts } = buildCheckedReliefGeometry(recipe);
  const record = { id: sample.id, label: sample.label, recipe, recipeHash: hash(recipe), geometryHash: hash(geometry), steps: geometry.steps,
    attempts, inspection: checked.inspection, openings: checked.openings, maxSampleError: checked.maxSampleError, gates: checked.gates, status: "rejected" };
  report.samples.push(record);
  if (Object.values(checked.gates).some(pass => !pass)) {
    console.log(JSON.stringify({ id: sample.id, rejected: record.gates })); await save(); continue;
  }
  const outputBase = `${base}-${sample.id}`, started = performance.now();
  Object.assign(record, await renderImprintMaterial({ geometry, settings, base: outputBase, log: console.log }));
  record.renderMs = Math.round(performance.now() - started);
  await writeFile(`${outputBase}-recipe.json`, JSON.stringify(recipe, null, 2) + "\n");
  const selected = [0, 47, 127].map(index => geometry.strands[index]);
  await writeFile(`${outputBase}-selected-loops.json`, JSON.stringify(selected));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1536" fill="#191813"/>${selected.map((strand, index) => `<path d="${strand.route.map((point, j) => `${j ? "L" : "M"}${point[0]} ${point[1]}`).join(" ")}Z" fill="none" stroke="${["#f1efe8", "#aaa79e", "#77746b"][index]}" stroke-width="2"/>`).join("")}</svg>`;
  await writeFile(`${outputBase}-loops.svg`, svg);
  const silhouette = Buffer.alloc(256 * 384 * 4);
  for (let i = 0; i < checked.mask.length; i++) silhouette.set(checked.mask[i] ? [241,239,232,255] : [25,24,19,255], i * 4);
  await sharp(silhouette, { raw: { width: 256, height: 384, channels: 4 } }).png().toFile(`${outputBase}-silhouette.png`);
  const projection = rasterDepth(geometry.surface, 1024, 1536);
  let lo = Infinity, hi = -Infinity;
  for (const value of projection) if (Number.isFinite(value)) { lo = Math.min(lo, value); hi = Math.max(hi, value); }
  const depth = Buffer.alloc(1024 * 1536 * 4);
  for (let i = 0; i < projection.length; i++) {
    const value = Number.isFinite(projection[i]) ? Math.round(45 + 190 * (projection[i] - lo) / (hi - lo)) : 25;
    depth.set([value, value, value, 255], i * 4);
  }
  await sharp(depth, { raw: { width: 1024, height: 1536, channels: 4 } }).png().toFile(`${outputBase}-depth.png`);
  for (const [name, suffix] of [["selected", "selected-loops.json"], ["loops", "loops.svg"], ["silhouette", "silhouette.png"], ["depth", "depth.png"], ["recipe", "recipe.json"]]) {
    const path = `${outputBase}-${suffix}`; record.outputs[name] = { path, hash: hash(await readFile(path)) };
  }
  if (sample.id === reliefImprintSamples[0].id) {
    const repeatStarted = performance.now();
    const repeat = await renderImprintMaterial({ geometry, settings, base: "outputs/imprint/generator-repeat" });
    record.renderRepeat = { milliseconds: Math.round(performance.now() - repeatStarted), hash: repeat.renderHash, matches: repeat.renderHash === record.renderHash };
  }
  record.status = record.material.nonfiniteShades === 0 && record.material.clippedHighlights === 0 && record.strands.represented === 128 ? "rendered" : "rejected";
  await save();
  console.log(JSON.stringify({ id: sample.id, family: recipe.course.family, status: record.status, renderMs: record.renderMs, openings: record.openings.length }));
}
report.status = report.samples.every(sample => sample.status === "rendered") ? "rendered" : "needs-work";
await save();
if (report.status !== "rendered") process.exitCode = 1;
