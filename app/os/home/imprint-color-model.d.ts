export const COLOR_GROUPS: readonly string[];
export const COLOR_PRESETS: Readonly<Record<string,Record<string,number>>>;
export function colorAreaWeight(group:string,t:number,u:number):number;
export function bundleColorAmount(state:Record<string,number>,t:number,u:number):number;
export function validateColorState(state:Record<string,number>):Record<string,number>;
