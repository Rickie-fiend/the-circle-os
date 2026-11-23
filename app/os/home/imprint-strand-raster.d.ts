import type { ImprintDay } from './imprint-writing-activity';
import type { StrandGroups, StrandPaint } from './imprint-strand-growth.js';

export const STRAND_KEY_MASK: number;
export const INK: readonly number[];
export const BONE: readonly number[];
export const ORANGE: readonly number[];
export type StrandMap = { orange: Uint32Array; bone: Uint32Array };
export function encodeStrandMap(words: Uint32Array): Uint8Array<ArrayBuffer>;
export function decodeStrandMap(bytes: ArrayBuffer, width: number, height: number): StrandMap;
export function strandGroupIndices(groups: StrandGroups): Uint8Array;
export function renderStrandFrame(base: Uint8ClampedArray, map: StrandMap, state: StrandPaint, groupIndices: Uint8Array, pulsing?: ReadonlySet<ImprintDay['group']>): Uint8ClampedArray<ArrayBuffer>;
