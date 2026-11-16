import type { PersonalImprintInput } from "./imprint-personal-recipe.js";
export const personalImprintSamples: { id: string; label: string; description: string; input: PersonalImprintInput }[];
export function reorderSampleInput(input: PersonalImprintInput): PersonalImprintInput;
export function correctedSampleInput(input: PersonalImprintInput): PersonalImprintInput;
