import type { ChapterDefinition, ChapterRun } from "./chapters/chapter-types";
import type { AccountScope } from "./account-scope";

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

export function readPinnedDoor(scope?: AccountScope): string | null;

export function pinnedChapterId(pin: string | null): string | null;

export function writePinnedChapter(chapterId: string, scope?: AccountScope): void;

export function writePinnedDoor(kind: DayDoorKind, scope?: AccountScope): void;

export function clearPinnedDoor(scope?: AccountScope): void;
