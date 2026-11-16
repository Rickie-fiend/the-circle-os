import { inspectLoopGeometry } from "./imprint-loop-inspection.mjs";
import { createReliefGeometry, sampleReliefStrand } from "./imprint-relief-geometry.mjs";
import { holes } from "../inspect-imprint-sori.mjs";

export function inspectReliefGeometry(geometry) {
  const checked = inspectLoopGeometry(geometry, { sampleStrand: sampleReliefStrand });
  const openings = holes(checked.mask);
  // Same relative rim limits as the accepted Sori inspection, rounded down.
  const gates = { ...checked.gates, smallOpenings: openings.every(hole => hole.widthRatio <= .16355 && hole.heightRatio <= .10324) };
  let maxSampleError = 0;
  for (const strand of geometry.strands) for (let j = 0; j <= geometry.steps; j += 256) {
    const sampled = sampleReliefStrand(geometry, strand, j / geometry.steps);
    maxSampleError = Math.max(maxSampleError, Math.hypot(...sampled.map((v, k) => v - strand.route[j][k])));
  }
  gates.actualSamples = maxSampleError < 1e-6;
  return { ...checked, gates, openings, maxSampleError };
}

export function buildCheckedReliefGeometry(recipe) {
  const attempts = [];
  for (const steps of [3072, 6144]) {
    const started = performance.now(), geometry = createReliefGeometry(recipe, steps);
    const constructionMs = performance.now() - started, inspectStarted = performance.now();
    const checked = inspectReliefGeometry(geometry);
    attempts.push({ steps, constructionMs: Math.round(constructionMs), inspectionMs: Math.round(performance.now() - inspectStarted), gates: checked.gates });
    if (checked.gates.smoothTurns || steps === 6144) return { geometry, checked, attempts };
  }
}
