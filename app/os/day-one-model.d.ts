import type { CircleState } from "./circle-os-shell";
import type { ChapterDefinition, ChapterRun } from "./chapters/chapter-types";

export function selectDayOneChapter(chapters: ChapterDefinition[], runs: Record<string, ChapterRun>): ChapterDefinition | undefined;
export function dayOneKeptBefore(runs: Record<string, ChapterRun>, dateKey: string): boolean;
export function saveDayOneProgress(state: CircleState, chapter: ChapterDefinition, run: ChapterRun, dateKey: string): CircleState;
export function dayOneSummary(run: ChapterRun): string[];
