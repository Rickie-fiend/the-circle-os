import { validateReliefImprintRecipe } from "../../app/os/home/imprint-relief-recipe.js";
import { createLoopGeometry, loopFrame, sampleLoopStrand } from "./imprint-loop-geometry.mjs";
import { resolveLoopCrossings, underpassOffset } from "./imprint-loop-crossings.mjs";
import { reliefHeight } from "./imprint-sori-relief.mjs";

// Reuse the exact accepted v4 relief field, retaining each family's own course.
export function createReliefGeometry(recipe, steps = 3072) {
  validateReliefImprintRecipe(recipe);
  if (![1536, 3072, 6144].includes(steps)) throw new Error("Use a supported production sampling level.");
  const geometry = createLoopGeometry(recipe.course, { steps });
  geometry.roundedRecipe = recipe;
  geometry.deformation = recipe.deformation;
  geometry.relief = { ...recipe.relief };
  geometry.foundation = geometry.strands.map(strand => ({
    depthOffset: strand.depthOffset, underpasses: structuredClone(strand.underpasses),
  }));
  for (let j = 0; j <= steps; j++) {
    const frame = loopFrame(geometry.recipe, j / steps);
    for (const strand of geometry.strands) {
      const height = reliefHeight(j / steps, strand.u) * frame.width * frame.thickness / 70 * geometry.fit.scale;
      for (let k = 0; k < 3; k++) strand.route[j][k] += frame.binormal[k] * height;
    }
  }
  geometry.reliefCrossingRepair = resolveLoopCrossings(geometry);
  for (let j = 0; j < steps; j++) for (let i = 0; i < geometry.strands.length; i++) {
    geometry.surface.vertices[j * geometry.strands.length + i] = geometry.strands[i].route[j].map((v, k) => v - (k === 2 ? .45 : 0));
  }
  // Relief can swell past the original course's bounds. Fit the final geometry,
  // keeping natural proportions and applying the same transform to its evaluator.
  geometry.surface.vertices = geometry.surface.vertices.map(p => deformPoint(geometry, p));
  for (const strand of geometry.strands) strand.route = strand.route.map(p => deformPoint(geometry, p));
  const bounds = geometry.surface.vertices.reduce((box, p) => [Math.min(box[0], p[0]), Math.min(box[1], p[1]), Math.max(box[2], p[0]), Math.max(box[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
  geometry.finalFit = { scale: Math.min(900 / (bounds[2] - bounds[0]), 1352 / (bounds[3] - bounds[1])), center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2] };
  const fit = p => finalPoint(geometry, p);
  geometry.surface.vertices = geometry.surface.vertices.map(fit);
  for (const strand of geometry.strands) strand.route = strand.route.map(fit);
  return geometry;
}

function deformPoint(geometry, point) {
  const d = geometry.deformation, y = point[1] - 768;
  return [512 + d.mirror * ((point[0] - 512) * d.width + d.lean * y + d.bend * Math.sin(2 * Math.PI * y / 1352 + d.phase)), 768 + y * d.height, point[2] * d.depth];
}

function finalPoint(geometry, point) {
  const { scale, center } = geometry.finalFit;
  return [512 + (point[0] - center[0]) * scale, 768 + (point[1] - center[1]) * scale, point[2] * scale];
}

export function sampleReliefStrand(geometry, strand, t) {
  const foundation = geometry.foundation[geometry.strands.indexOf(strand)];
  const point = sampleLoopStrand(geometry, { ...strand, ...foundation }, t);
  const frame = loopFrame(geometry.recipe, t);
  const height = reliefHeight(t, strand.u) * frame.width * frame.thickness / 70 * geometry.fit.scale;
  for (let k = 0; k < 3; k++) point[k] += frame.binormal[k] * height;
  point[2] += strand.depthOffset - underpassOffset(strand.underpasses, t);
  return finalPoint(geometry, deformPoint(geometry, point));
}
