export type PersonalImprintInput = {
  name: string; birthday: string; feeling?: number;
  answers: {
    situations: string[]; lifeNow: string;
    pastEffort: { kind: "reported" | "nothing-comes-to-mind"; items?: { category: string; description: string; status: "still-doing" | "finished" | "stopped" }[] };
    wantedChanges: { choice: string; detail?: string }[]; primaryFocus?: string;
    wake: string; bed: string;
    habit: { kind: "start" | "keep"; wording: string; cue: { choice: string; detail?: string } };
    feeling?: number;
  };
};
export type PersonalImprintRecipe = {
  version: 1; normalizationVersion: 1; baseGeometryHash: string;
  parameters: { width: number; balance: number; bend: number; lean: number; height: number; spacing: number; depth: number; phase: number };
};
export const PERSONAL_IMPRINT_BASE_HASH: string;
export const PERSONAL_IMPRINT_LIMITS: Readonly<PersonalImprintRecipe["parameters"]>;
export class ImprintInputError extends Error { field: string; }
export function normalizePersonalImprintInput(input: PersonalImprintInput): unknown;
export function createPersonalImprintRecipe(input: PersonalImprintInput): Promise<Readonly<PersonalImprintRecipe>>;
export function validatePersonalImprintRecipe(recipe: PersonalImprintRecipe): PersonalImprintRecipe;
export function retainPersonalImprintRecipe(existing: PersonalImprintRecipe | null | undefined, input: PersonalImprintInput): Promise<PersonalImprintRecipe>;
