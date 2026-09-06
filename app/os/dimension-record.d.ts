export type DimensionWeek = { weekKey: string; fed: boolean };
export type DimensionRow = {
  dimension: "mind" | "body" | "spirit" | "social";
  trait: string;
  weeks: DimensionWeek[];
  fed: number;
  lastFed: string;
  weeksSince: number | null;
  habits: { id: string; action: string; identity: string }[];
};
export const DIMENSION_WINDOW_WEEKS: number;
export function dimensionWeeks(
  todayKey: string,
  hour?: number,
  window?: number,
): string[];
export function dimensionRecord(
  state: unknown,
  todayKey: string,
  hour?: number,
): DimensionRow[];
export function starvedDimension(record: DimensionRow[]): DimensionRow | null;
