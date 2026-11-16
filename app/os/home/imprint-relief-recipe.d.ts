import type { PersonalImprintInput } from "./imprint-personal-recipe.js";
import type { LoopImprintRecipe } from "./imprint-loop-recipe.js";
export type ReliefImprintRecipe = {
  kind: "rounded-loop"; version: 1; method: "rounded-folded-bundle-v1";
  course: LoopImprintRecipe;
  relief: { method: "periodic-rounded-section-v1"; amplitude: number };
  deformation: { width: number; height: number; lean: number; bend: number; phase: number; depth: number; mirror: number };
};
export const RELIEF_DEFORMATION_LIMITS: Readonly<Record<keyof ReliefImprintRecipe["deformation"], number[]>>;
export function createReliefImprintRecipe(input: PersonalImprintInput): Promise<ReliefImprintRecipe>;
export function validateReliefImprintRecipe(recipe: ReliefImprintRecipe): ReliefImprintRecipe;
export function retainReliefImprintRecipe(existing: ReliefImprintRecipe | null | undefined, input: PersonalImprintInput): Promise<ReliefImprintRecipe>;
