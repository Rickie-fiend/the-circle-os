import type {PersonalImprintInput} from "./imprint-personal-recipe.js";
export type LoopImprintRecipe={kind:"closed-loop";version:2;method:"periodic-folded-bundle-v1";family:"sweep"|"return"|"curl";controls:readonly (readonly number[])[];filamentCount:number;thickness:number;phase:number;grain:number};
export function createLoopImprintRecipe(input:PersonalImprintInput):Promise<LoopImprintRecipe>;
export function validateLoopImprintRecipe(recipe:LoopImprintRecipe):LoopImprintRecipe;
export function retainLoopImprintRecipe(existing:LoopImprintRecipe|null|undefined,input:PersonalImprintInput):Promise<LoopImprintRecipe>;
