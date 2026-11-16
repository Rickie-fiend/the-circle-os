import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReliefImprintRecipe } from "../app/os/home/imprint-relief-recipe.js";
import { loopImprintSamples } from "../app/os/home/imprint-loop-samples.js";
import { reliefValidationSamples } from "../app/os/home/imprint-relief-samples.js";
import { buildCheckedReliefGeometry } from "./lib/imprint-relief-inspection.mjs";
import { generatorSourceHashes } from "./lib/imprint-generator-artifacts.mjs";

const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const results = [];
await mkdir("outputs/imprint", { recursive: true });
const population = process.argv.includes("--population");
const samples = population ? await reliefValidationSamples() : loopImprintSamples;
const output = population ? "docs/design/personal-imprint-generator-v1-population.json" : "outputs/imprint/rounded-generator-development.json";
const sourceHashes = await generatorSourceHashes(), fixturesHash = hash(samples);
for (const sample of samples) {
  const recipe = await createReliefImprintRecipe(sample.input), started = performance.now();
  const { geometry, checked, attempts } = buildCheckedReliefGeometry(recipe);
  const record = { id: sample.id, family: recipe.course.family, recipeHash: hash(recipe), geometryHash: hash(geometry),
    milliseconds: Math.round(performance.now() - started), attempts, inspection: checked.inspection, openings: checked.openings, gates: checked.gates };
  results.push(record);
  await writeFile(output, JSON.stringify({ status: results.length === samples.length ? "complete" : "running", sourceHashes, fixturesHash, results }, null, 2) + "\n");
  console.log(JSON.stringify({ id: record.id, family: record.family, milliseconds: record.milliseconds, failed: Object.keys(record.gates).filter(key => !record.gates[key]), openings: record.openings, turns: record.inspection.peakTurnDegrees }));
}
if (results.some(result => Object.values(result.gates).some(pass => !pass))) process.exitCode = 1;
