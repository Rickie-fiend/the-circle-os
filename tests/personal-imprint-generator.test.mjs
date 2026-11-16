import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReliefImprintRecipe, retainReliefImprintRecipe, validateReliefImprintRecipe } from "../app/os/home/imprint-relief-recipe.js";
import { reliefImprintSamples, reliefValidationSamples } from "../app/os/home/imprint-relief-samples.js";
import { reorderSampleInput, correctedSampleInput } from "../app/os/home/imprint-personal-samples.js";
import { createLoopImprintRecipe } from "../app/os/home/imprint-loop-recipe.js";
import { createReliefGeometry, sampleReliefStrand } from "../scripts/lib/imprint-relief-geometry.mjs";
import { inspectReliefGeometry } from "../scripts/lib/imprint-relief-inspection.mjs";
const hash = value => createHash("sha256").update(value).digest("hex");

test("rounded recipes repeat, normalize ordering, exclude activity and retain original forms", async () => {
  for (const sample of reliefImprintSamples) {
    const before = structuredClone(sample.input), recipe = await createReliefImprintRecipe(sample.input);
    assert.deepEqual(await createReliefImprintRecipe(reorderSampleInput(sample.input)), recipe);
    assert.deepEqual(await createReliefImprintRecipe({ ...sample.input, feeling: 0, email: "ignored@example.invalid", answers: { ...sample.input.answers, feeling: 10, activity: 88 } }), recipe);
    assert.equal(await retainReliefImprintRecipe(recipe, correctedSampleInput(sample.input)), recipe);
    assert.equal(await retainReliefImprintRecipe(recipe, {}), recipe);
    assert.deepEqual(await retainReliefImprintRecipe(null, sample.input), recipe);
    assert.notDeepEqual(await createReliefImprintRecipe(correctedSampleInput(sample.input)), recipe);
    assert.deepEqual(sample.input, before);
    assert.deepEqual(validateReliefImprintRecipe(JSON.parse(JSON.stringify(recipe))), recipe);
    assert.ok(Object.isFrozen(recipe.course.controls[0]));
    assert.ok(!JSON.stringify(recipe).includes(sample.input.birthday));
  }
});

test("bad input and unsupported construction fail without an invented fallback", async () => {
  await assert.rejects(createReliefImprintRecipe({ name: "" }), /name/);
  const recipe = await createReliefImprintRecipe(reliefImprintSamples[0].input);
  for (const invalid of [{ ...recipe, version: 3 }, { ...recipe, name: "extra" }, { ...recipe, relief: { ...recipe.relief, amplitude: 1 } }, { ...recipe, course: { ...recipe.course, thickness: NaN } }]) {
    assert.throws(() => validateReliefImprintRecipe(invalid));
  }
  assert.throws(() => createReliefGeometry(recipe, 32), /sampling/);
});

test("thirty validation profiles are fixed, balanced and selected before geometry", async () => {
  const samples = await reliefValidationSamples();
  assert.deepEqual(await reliefValidationSamples(), samples);
  assert.equal(samples.length, 30);
  assert.equal(new Set(samples.map(sample => sample.id)).size, 30);
  for (const family of ["sweep", "return", "curl"]) assert.equal(samples.filter(sample => sample.family === family).length, 10);
  assert.ok(samples.some(sample => sample.input.answers.pastEffort.kind === "nothing-comes-to-mind"));
  assert.ok(samples.some(sample => sample.input.answers.wantedChanges[0].choice === "not-sure-yet"));
});

test("legacy recipes and every accepted Sori artifact remain intact", async () => {
  const report = JSON.parse(await readFile("docs/design/personal-imprint-sori-v4-inspection.json", "utf8"));
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(hash(await readFile(path)), expected, path);
  for (const output of Object.values(report.outputs)) assert.equal(hash(await readFile(output.path)), output.hash, output.path);
  for (const sample of reliefImprintSamples) {
    const original = JSON.parse(await readFile(`docs/design/personal-imprint-loops-v2-${sample.id}-recipe.json`, "utf8"));
    assert.deepEqual(await createLoopImprintRecipe(sample.input), original);
  }
});

test("generated rounded geometry reproduces and its evaluator follows actual closed strands", async () => {
  const recipe = await createReliefImprintRecipe(reliefImprintSamples[0].input);
  const geometry = createReliefGeometry(recipe), checked = inspectReliefGeometry(geometry);
  assert.ok(Object.values(checked.gates).every(Boolean), JSON.stringify(checked.inspection));
  const digest = hash(JSON.stringify(geometry));
  assert.equal(hash(JSON.stringify(createReliefGeometry(JSON.parse(JSON.stringify(recipe))))), digest);
  for (const strand of geometry.strands) {
    assert.equal(strand.ends.length, 0);
    assert.deepEqual(strand.route[0], strand.route.at(-1));
    const sampled = sampleReliefStrand(geometry, strand, .5);
    assert.ok(Math.hypot(...sampled.map((v, k) => v - strand.route[geometry.steps / 2][k])) < 1e-6);
  }
});
