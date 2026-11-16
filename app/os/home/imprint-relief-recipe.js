import { createLoopImprintRecipe, validateLoopImprintRecipe } from "./imprint-loop-recipe.js";
import { normalizePersonalImprintInput } from "./imprint-personal-recipe.js";
import { roundedCourses } from "./imprint-relief-courses.js";

export const RELIEF_DEFORMATION_LIMITS = Object.freeze({ width: [.9, 1.15], height: [.8, 1.2], lean: [-.18, .18], bend: [-65, 65], phase: [0, Math.PI * 2], depth: [1.6, 1.85], mirror: [-1, 1] });

// A separate version preserves all earlier formats. Coherent deformations keep
// the smooth construction intact instead of independently moving nearby knots.
export async function createReliefImprintRecipe(input) {
  const original = await createLoopImprintRecipe(input);
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(normalizePersonalImprintInput(input)))));
  const data = new DataView(bytes.buffer), deformation = {};
  for (const [index, [key, [low, high]]] of Object.entries(RELIEF_DEFORMATION_LIMITS).entries()) {
    const fraction = data.getUint32(index * 4, false) / 0xffffffff;
    // The broad bend's phase chooses its handedness as one coherent gesture.
    deformation[key] = key === "mirror" ? (data.getUint32(16, false) < 0x80000000 ? 1 : -1) : Number((low + fraction * (high - low)).toFixed(8));
  }
  return Object.freeze({
    kind: "rounded-loop", version: 1, method: "rounded-folded-bundle-v1",
    course: roundedCourses[original.family],
    relief: Object.freeze({ method: "periodic-rounded-section-v1", amplitude: .8 }),
    deformation: Object.freeze(deformation),
  });
}

export function validateReliefImprintRecipe(recipe) {
  if (recipe?.kind !== "rounded-loop" || recipe.version !== 1 || recipe.method !== "rounded-folded-bundle-v1") {
    throw new Error("This form needs its original supported rounded-loop version.");
  }
  if (Object.keys(recipe).sort().join() !== "course,deformation,kind,method,relief,version" ||
      Object.keys(recipe.relief ?? {}).sort().join() !== "amplitude,method" ||
      recipe.relief.method !== "periodic-rounded-section-v1" || recipe.relief.amplitude !== .8 ||
      Object.keys(recipe.deformation ?? {}).sort().join() !== Object.keys(RELIEF_DEFORMATION_LIMITS).sort().join()) {
    throw new Error("The rounded-loop construction settings are invalid.");
  }
  validateLoopImprintRecipe(recipe.course);
  if (JSON.stringify(recipe.course) !== JSON.stringify(roundedCourses[recipe.course.family])) {
    throw new Error("The rounded-loop course needs its retained supported construction.");
  }
  for (const [key, [low, high]] of Object.entries(RELIEF_DEFORMATION_LIMITS)) {
    const value = recipe.deformation[key];
    if (!Number.isFinite(value) || value < low || value > high || key === "mirror" && ![-1, 1].includes(value)) throw new Error("The personal form is outside its supported deformation limits.");
  }
  return recipe;
}

export async function retainReliefImprintRecipe(existing, input) {
  return existing == null ? createReliefImprintRecipe(input) : validateReliefImprintRecipe(existing);
}
