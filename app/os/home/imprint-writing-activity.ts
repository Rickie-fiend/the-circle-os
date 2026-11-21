import { isDevelopmentTestAccount } from "../auth/development-test-session.js";
import type { AccountScope } from "../account-scope";
import type { WritingEntry, WritingResult, WritingState } from "../writing-model.js";
import type { Contribution } from "./imprint-activity-model.js";
import { FADED_ORANGE, FRESH_ORANGE } from "./imprint-growth-model.js";
import { imprintFadeAt } from "./imprint-fade-time.js";
export { imprintFadeAt as writingFadeAt } from "./imprint-fade-time.js";

type Group = "notes" | "thoughts";
type FirstUse = { group: Group; day: string; at: string; timeZone: string; fadeAt: number };
export type ImprintDay = Omit<FirstUse, "group"> & { group: Group | "routine" | "log-week" | "protocol" | "starting"; sources: string[] };
export type WritingImprint = { sources: Record<string, string>; days: Record<string, FirstUse> };

export function canReviewWritingImprint(scope: AccountScope) {
  if (process.env.CIRCLE_IMPRINT_HOSTED_REVIEW === "enabled") return scope.kind === "account";
  return process.env.NODE_ENV === "development" && isDevelopmentTestAccount(scope);
}


function hasWriting(entry: WritingEntry) {
  const { title, body } = entry.versions.at(-1)!.content;
  return Boolean(body.trim() || (entry.kind === "note" && title.trim()));
}

/** Called inside the same transaction as the accepted writing and its receipt. */
export function recordWritingImprint(before: WritingState, { state, receipt }: WritingResult): Group | null {
  if (Object.hasOwn(before.receipts, receipt.operationId)) return null;
  const { entryId } = receipt;
  if (receipt.outcome === "deleted") {
    const imprint = state.imprint;
    if (!imprint || !Object.hasOwn(imprint.sources, entryId)) return null;
    const key = imprint.sources[entryId];
    delete imprint.sources[entryId];
    if (!Object.values(imprint.sources).includes(key)) delete imprint.days[key];
    return null;
  }
  if (receipt.outcome !== "saved" || Object.hasOwn(before.entries, entryId)) return null;
  const entry = state.entries[entryId];
  const group = entry.kind === "note" ? "notes" : entry.kind === "deep-thought" ? "thoughts" : null;
  if (!group || !hasWriting(entry)) return null;
  const { attribution: { day, timeZone }, savedAt: at } = entry.versions[0];
  const imprint = state.imprint ??= { sources: {}, days: {} };
  const key = `${group}:${day}`;
  imprint.days[key] ??= { group, day, at, timeZone, fadeAt: imprintFadeAt(at, timeZone) };
  Object.defineProperty(imprint.sources, entryId, { value: key, enumerable: true, configurable: true, writable: true });
  return group;
}

export function projectWritingImprint(state: WritingState) {
  const imprint = state.imprint;
  if (!imprint) return [];
  const active = new Map<string, string[]>();
  for (const [id, key] of Object.entries(imprint.sources)) {
    const entry = state.entries[id];
    if (entry?.status !== "active" || !hasWriting(entry)) continue;
    const sources = active.get(key);
    if (sources) sources.push(id);
    else active.set(key, [id]);
  }
  return [...active].flatMap(([key, sources]) => {
    const day = imprint.days[key];
    return day ? [{ ...day, sources }] : [];
  }).sort((a, b) => a.at.localeCompare(b.at) || a.day.localeCompare(b.day));
}

export function writingImprintContributions(days: ImprintDay[], now: number): Contribution[] {
  return days.filter(day => Date.parse(day.at) <= now).map(day => ({
    group: day.group, day: day.day, at: day.at, sources: day.sources,
    brightness: now < day.fadeAt ? FRESH_ORANGE : FADED_ORANGE,
  }));
}
