import type { ImprintDay } from './imprint-writing-activity';

export const STRAND_COUNT: number;
export const STRAND_STEPS: number;
export const FIRST_STRAND_LENGTH: number;
export const SLOW_AFTER_DAY: number;
export type Strand = { id: number; length: number };
export type StrandGroups = Record<ImprintDay['group'], readonly Strand[]>;
export type StrandPaint = { coverage: Uint8Array; fresh: Uint8Array; hasColor: boolean };
export function strandFinishDay(firstDay: string): number;
export function strandSchedule(strands: readonly Strand[], finishDay: number): { early: number; slow: number };
export function coloredStrandLength(length: number, start: number, day: number, rates: { early: number; slow: number }): number;
export function strandPaint(groups: StrandGroups, days: readonly ImprintDay[], now: number, excludedSources?: ReadonlySet<string>): StrandPaint;
