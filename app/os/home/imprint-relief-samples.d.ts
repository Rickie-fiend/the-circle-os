import type { PersonalImprintInput } from "./imprint-personal-recipe.js";
export type ReliefSample = { id: string; label: string; description: string; input: PersonalImprintInput; family?: string };
export const reliefImprintSamples: ReliefSample[];
export function reliefValidationSamples(): Promise<ReliefSample[]>;
