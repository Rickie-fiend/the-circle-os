import type { ImprintDay } from "./imprint-writing-activity";
import { imprintFadeAt } from "./imprint-fade-time.js";
import type { logImprintSources } from "./imprint-log-activity";
import type { ChapterRun } from "../chapters/chapter-types";

export type RoutineCompletion = {
  id: string;
  dateKey: string;
  completed: boolean;
  imprintFirstUse?: { at: string; timeZone: string };
  imprintOperation?: string;
};

export type ProtocolImprintSeal = {
  dateKey?: string;
  sealed?: boolean;
  imprintFirstUse?: { at: string; timeZone: string };
  imprintOperation?: string;
};

export const routineImprintSource = (completionId: string) => `habit:${completionId}`;
export const taskImprintSource = (key: string, repeating: boolean) =>
  repeating ? `task:day:${key}` : `task:once:${key}`;
export const protocolImprintSource = (sealId: string) => `protocol:${sealId}`;
export const chapterImprintSource = (runId: string) => `chapter:${runId}`;

export function stampChapterFinish(
  previous: ChapterRun | undefined,
  saved: ChapterRun | undefined,
  finishedAt: string,
  timing: NonNullable<ChapterRun["imprintFinish"]>,
) {
  if (saved?.status !== "completed" || saved.completedAt !== finishedAt) return saved;
  if (previous?.status !== "completed") return { ...saved, imprintFinish: timing };
  if (previous.completedAt === finishedAt && previous.imprintFinish && !saved.imprintFinish) {
    return { ...saved, imprintFinish: previous.imprintFinish };
  }
  return saved;
}

export type TaskOrigin = "routine" | "week";
type TaskUse = { origin: TaskOrigin; day: string; at: string; timeZone: string };
export type TaskImprintRecord = TaskUse & { operation: string; firstUses: TaskUse[] };
export const taskImprintGroup = (origin: TaskOrigin) => origin === "week" ? "log-week" : "routine";

type TaskRecords = {
  items: Record<string, { status: string; imprint?: TaskImprintRecord }>;
  completions?: Record<string, { completed: boolean; imprint?: TaskImprintRecord }>;
};

export function projectLocalImprint(
  completions: Record<string, RoutineCompletion>,
  tasks?: TaskRecords,
  seals?: Record<string, ProtocolImprintSeal>,
  logs: ReturnType<typeof logImprintSources> = [],
  clock = Date.now(),
  chapters: Record<string, ChapterRun> = {},
): ImprintDay[] {
  const days = new Map<string, Omit<ImprintDay, "fadeAt"> & { eligibleAt: number }>();
  const include = (group: ImprintDay["group"], day: string, at: string, timeZone: string, source?: string, eligibleAt = Date.parse(at)) => {
    const key = `${group}:${day}`;
    const existing = days.get(key);
    const sources = existing?.sources ?? [];
    if (source) sources.push(source);
    if (!existing || eligibleAt < existing.eligibleAt) days.set(key, { group, day, at, timeZone, sources, eligibleAt });
  };
  for (const completion of Object.values(completions)) {
    const firstUse = completion.imprintFirstUse;
    if (!firstUse) continue;
    // An undone source still anchors the original color age for this day.
    include("routine", completion.dateKey, firstUse.at, firstUse.timeZone,
      completion.completed ? routineImprintSource(completion.id) : undefined);
  }
  const includeTask = (imprint: TaskImprintRecord | undefined, completed: boolean, source: string) => {
    if (!imprint) return;
    for (const use of imprint.firstUses) include(taskImprintGroup(use.origin), use.day, use.at, use.timeZone);
    if (completed) include(taskImprintGroup(imprint.origin), imprint.day, imprint.at, imprint.timeZone, source);
  };
  for (const [key, task] of Object.entries(tasks?.items ?? {})) {
    includeTask(task.imprint, task.status === "completed", taskImprintSource(key, false));
  }
  for (const [key, task] of Object.entries(tasks?.completions ?? {})) {
    includeTask(task.imprint, task.completed, taskImprintSource(key, true));
  }
  for (const [key, seal] of Object.entries(seals ?? {})) {
    const firstUse = seal.imprintFirstUse;
    if (!firstUse || !seal.dateKey) continue;
    include("protocol", seal.dateKey, firstUse.at, firstUse.timeZone,
      seal.sealed ? protocolImprintSource(key) : undefined);
  }
  for (const log of logs) {
    if (log.eligibleAt <= clock) include("log-week", log.day, log.at, log.timeZone,
      log.active ? log.source : undefined, log.eligibleAt);
  }
  for (const [id, run] of Object.entries(chapters)) {
    if (run.status !== "completed" || !run.completedAt || !run.imprintFinish) continue;
    const { day, timeZone } = run.imprintFinish;
    include("starting", day, run.completedAt, timeZone, chapterImprintSource(id));
  }
  return [...days.values()].filter(day => day.sources.length)
    .sort((a, b) => a.at.localeCompare(b.at) || a.day.localeCompare(b.day))
    .map(({ group, day, at, timeZone, sources }) => ({
      group, day, at, timeZone, sources, fadeAt: imprintFadeAt(at, timeZone),
    }));
}
