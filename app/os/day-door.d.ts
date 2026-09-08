import type { ChapterDefinition, ChapterRun } from "./chapters/chapter-types";

export type DayDoorKind =
  | "day-one"
  | "week-setup"
  | "log-setup"
  | "week-review"
  | "day-open";

export type DayDoorOffer = {
  /** Whether this door is ready to be offered at all. */
  offered: boolean;
  /** The Circle day it was last put down on, if it was. */
  dismissedKey?: string | null;
};

export const DAY_DOOR_ORDER: DayDoorKind[];

export function dayDoor(
  offers: Partial<Record<DayDoorKind, DayDoorOffer>>,
  todayKey: string,
): DayDoorKind | null;

export function dayOpenRunId(
  chapter: ChapterDefinition | null | undefined,
  dateKey: string,
): string;

export function dayWasOpened(run: ChapterRun | null | undefined): boolean;

export function readPinnedDoor(): DayDoorKind | null;

export function writePinnedDoor(kind: DayDoorKind): void;

export function clearPinnedDoor(): void;
