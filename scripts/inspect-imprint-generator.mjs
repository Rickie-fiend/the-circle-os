import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { createReliefImprintRecipe, retainReliefImprintRecipe } from "../app/os/home/imprint-relief-recipe.js";
import { reliefImprintSamples, reliefValidationSamples } from "../app/os/home/imprint-relief-samples.js";
import { reorderSampleInput, correctedSampleInput } from "../app/os/home/imprint-personal-samples.js";
import { createReliefGeometry } from "./lib/imprint-relief-geometry.mjs";
import { inspectReliefGeometry } from "./lib/imprint-relief-inspection.mjs";
import { rasterDepth } from "./lib/imprint-network-geometry.mjs";
import { generatorBase as base, artifactHash as hash, generatorSourceHashes, preservedSoriReference } from "./lib/imprint-generator-artifacts.mjs";

const report = JSON.parse(await readFile(`${base}-inspection.json`, "utf8")), masks = [];
const sources = await generatorSourceHashes(), reference = await preservedSoriReference();
for (const sample of report.samples) {
  const fixture = reliefImprintSamples.find(item => item.id === sample.id);
  const recipe = JSON.parse(await readFile(`${base}-${sample.id}-recipe.json`, "utf8"));
  const geometry = createReliefGeometry(recipe, sample.steps), checked = inspectReliefGeometry(geometry);
  masks.push({ id: sample.id, mask: checked.mask });
  const behaviour = {
    repeated: hash(await createReliefImprintRecipe(fixture.input)) === sample.recipeHash,
    reordered: hash(await createReliefImprintRecipe(reorderSampleInput(fixture.input))) === sample.recipeHash,
    retained: (await retainReliefImprintRecipe(recipe, correctedSampleInput(fixture.input))) === recipe,
    feelingExcluded: hash(await createReliefImprintRecipe({ ...fixture.input, feeling: 0, answers: { ...fixture.input.answers, feeling: 10 } })) === sample.recipeHash,
  };
  const assets = await Promise.all(Object.entries(sample.outputs).map(async ([name, output]) => ({ name, matches: hash(await readFile(output.path)) === output.hash })));
  const selected = JSON.parse(await readFile(sample.outputs.selected.path, "utf8"));
  const full = await readFile(sample.outputs.full.path), { data, info } = await sharp(full).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const depth = rasterDepth(geometry.surface, 1024, 1536), nearX = new Uint8Array(depth.length), near = new Uint8Array(depth.length);
  for (let y = 0; y < 1536; y++) for (let x = 0; x < 1024; x++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && x + dx < 1024 && Number.isFinite(depth[y * 1024 + x + dx])) { nearX[y * 1024 + x] = 1; break; }
  for (let y = 0; y < 1536; y++) for (let x = 0; x < 1024; x++) for (let dy = -2; dy <= 2; dy++) if (y + dy >= 0 && y + dy < 1536 && nearX[(y + dy) * 1024 + x]) { near[y * 1024 + x] = 1; break; }
  let clipped = 0, nonopaque = 0, outside = 0;
  for (let i = 0; i < depth.length; i++) {
    if (data[i * 4 + 3] !== 255) nonopaque++;
    for (let c = 0; c < 3; c++) if (data[i * 4 + c] === 255) clipped++;
    if (!near[i] && report.settings.palette.background.some((value, c) => Math.abs(data[i * 4 + c] - value) > 1)) outside++;
  }
  const phoneMatches = hash(await sharp(full).resize({ width: 390, kernel: report.settings.resamplingKernel }).png().toBuffer()) === sample.outputs["390"].hash;
  const gates = { ...checked.gates, recipeReproduced: hash(recipe) === sample.recipeHash && hash(sample.recipe) === sample.recipeHash,
    geometryReproduced: hash(geometry) === sample.geometryHash, behaviour: Object.values(behaviour).every(Boolean),
    assetsCurrent: assets.length === 11 && assets.every(asset => asset.matches) && hash(full) === sample.renderHash,
    selectedMatch: selected.length === 3 && selected.every(strand => hash(strand) === hash(geometry.strands.find(actual => actual.id === strand.id))),
    dimensions: info.width === 1024 && info.height === 1536, opaque: nonopaque === 0, unclipped: clipped === 0,
    preservedVoids: outside === 0, phoneMatches, allStrands: sample.strands.represented === 128,
    finiteShading: sample.material.nonfiniteShades === 0 && sample.material.clippedHighlights === 0 };
  sample.independent = { inspection: checked.inspection, openings: checked.openings, maxSampleError: checked.maxSampleError, behaviour, assets, pixels: { clipped, nonopaque, outside, phoneMatches }, gates };
  sample.status = Object.values(gates).every(Boolean) ? "verified" : "rejected";
  console.log(JSON.stringify({ id: sample.id, status: sample.status, failed: Object.keys(gates).filter(key => !gates[key]) }));
}
const population = JSON.parse(await readFile(`${base}-population.json`, "utf8")), fixtures = await reliefValidationSamples();
const populationRecipesCurrent = (await Promise.all(fixtures.map(async (fixture, index) => {
  const recipe = await createReliefImprintRecipe(fixture.input), result = population.results[index];
  return result?.recipeHash === hash(recipe) && result.family === recipe.course.family;
}))).every(Boolean);
const pairs = [];
for (let i = 0; i < masks.length; i++) for (let j = i + 1; j < masks.length; j++) {
  let intersection = 0, union = 0;
  for (let p = 0; p < masks[i].mask.length; p++) { const a = masks[i].mask[p], b = masks[j].mask[p]; if (a && b) intersection++; if (a || b) union++; }
  pairs.push({ a: masks[i].id, b: masks[j].id, silhouetteIoU: intersection / union });
}
report.gates = {
  sourcesCurrent: hash(sources) === hash(report.sourceHashes), approvedSoriPreserved: reference.sourcesMatch && reference.assetsMatch && reference.geometryHash === report.approvedReference.geometryHash && reference.renderHash === report.approvedReference.renderHash,
  sixExamples: report.samples.length === 6 && report.samples.every((sample, i) => sample.id === reliefImprintSamples[i].id && sample.status === "verified"),
  threeFamilies: new Set(report.samples.map(sample => sample.recipe.course.family)).size === 3,
  distinctGeometry: new Set(report.samples.map(sample => sample.geometryHash)).size === 6,
  renderRepeated: report.samples[0].renderRepeat?.matches === true,
  population: populationRecipesCurrent && population.status === "complete" && hash(population.sourceHashes) === hash(sources) && population.fixturesHash === hash(fixtures) && population.results.length === 30 && population.results.every((result, i) => result.id === fixtures[i].id && Object.values(result.gates).every(Boolean)),
  onlyFibres: report.settings.surface.visible === false && report.settings.surface.occlude === false,
};
report.pairwiseSilhouettes = pairs;
report.checksPass = Object.values(report.gates).every(Boolean);
report.readyForReview = report.checksPass;
report.status = report.checksPass ? "ready-for-visual-review" : "needs-work";
report.limitations = ["Finite samples do not guarantee every possible input or full physical collision freedom.", "Broad visible overlaps require visual review; projected strand crossings are a different measurement.", "The generator is an isolated offline renderer; no phone rendering or personal recipe storage is implemented."];
await writeFile(`${base}-inspection.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ readyForReview: report.readyForReview, gates: report.gates, pairs }));
if (!report.checksPass) process.exitCode = 1;
