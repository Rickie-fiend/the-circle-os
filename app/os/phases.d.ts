export type Phase = "one-day" | "one-week" | "the-week-read";

export type GatedApp = "protocol" | "week";

export const PHASES: Phase[];

export const PROTOCOL_DAY: number;

export const WEEK_DAY: number;

export function journeyDay(
  keptDayOneOn: string | null | undefined,
  todayKey: string,
): number;

export function phaseForDay(day: number): Phase;

export const SETUP_CHAPTER: Record<GatedApp, string>;

export function appIsOpen(app: string, runs: unknown): boolean;

export function lockedUntil(app: string): string;
