export type WeekDaySummary = {
  dateKey: string;
  letter: string;
  name: string;
  date: string;
  title: string;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  moments: { at: string; text: string }[];
  kept: number;
  due: number;
  tasks: number;
  hours: number;
  touched: boolean;
};

export type WeekTotals = {
  days: number;
  touched: number;
  kept: number;
  tasks: number;
  hours: number;
};

export const WEEK_DAY_LETTERS: readonly string[];
export const WEEK_SPAN_BACK: number;
export const WEEK_SPAN_FORWARD: number;
export function weekStartKey(dateKey: string): string;
export function weekDaySummary(
  state: unknown,
  dateKey: string,
  todayKey?: string,
): WeekDaySummary;
export function weekDays(state: unknown, todayKey?: string): WeekDaySummary[];
export function weekSpan(
  state: unknown,
  todayKey?: string,
  back?: number,
  forward?: number,
): WeekDaySummary[];
export function weekTotals(state: unknown, todayKey?: string): WeekTotals;
export function weekCoverLine(state: unknown, todayKey?: string): string;
export const WEEK_BAR_LENGTH: number;
export const WEEK_ROLLOVER_HOUR: number;
export function planningWeekStartKey(todayKey?: string, hour?: number): string;
export function weekBarDays(
  state: unknown,
  todayKey?: string,
  hour?: number,
): WeekDaySummary[];

export type WeekRecord = {
  weekKey: string;
  kept: boolean;
  fed: "" | "mind" | "body" | "spirit" | "social";
  moved: string;
  blocked: string;
  keep: string;
  reviewedAt: string;
};
export const WEEK_FED_VALUES: Set<string>;
export function normalizeWeekRecords(value: unknown): Record<string, WeekRecord>;
export function recordWeekReview(
  state: unknown,
  weekKey: string,
  /**
   * His answers, as the chapter gave them. `fed` is checked against the four
   * dimensions on the way in, so anything else — including the honest "none of
   * them" — is kept as no dimension rather than refused.
   */
  review: {
    kept?: boolean;
    fed?: string;
    moved?: string;
    blocked?: string;
    keep?: string;
  },
  at?: string,
): never;
export function weekWasReviewed(state: unknown, weekKey: string): boolean;

export function weekRecords(state: unknown): WeekRecord[];
