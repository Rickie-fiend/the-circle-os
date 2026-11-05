import { CIRCLE_DAY_START_HOUR, queueProfileUpdate } from "./circle-os-model.js";

/** @typedef {{ id: string, start: string, end: string, title?: string, activity?: string, moments?: string[], note?: string, createdAt?: string, updatedAt?: string }} LogBlock */
/** @typedef {{ title?: string, timeBlocks?: LogBlock[] }} LogDay */
/** @typedef {{ id: string, dateKey: string, blockId: string, correctedAt: string, before: LogBlock, after: LogBlock }} LogCorrection */
/** @typedef {{ id: string, dateKey: string, blockId: string, expected: string, title: string, moments: string[], at: string }} LogCorrectionRequest */

/** Include revision, timing, content and unknown legacy fields in the guard.
 * @param {LogBlock | undefined} block
 */
export function logBlockSignature(block) {
  return block ? JSON.stringify(Object.fromEntries(Object.entries(block).sort(([a], [b]) => a.localeCompare(b)))) : "";
}

/** Compare visible words without rewriting an unchanged legacy note's shape.
 * @param {LogBlock} block
 */
export function logEntryWords(block) {
  return {
    title: (block.title || block.activity || "").trim(),
    moments: (block.moments?.length ? block.moments : block.note ? [block.note] : [])
      .flatMap((text) => text.split("\n")).map((text) => text.trim()).filter(Boolean),
  };
}

/** Correct only words in an existing past entry. Receipts and the current
 * dated empty value survive independently; clearing never removes its ID.
 * @param {import("./circle-os-shell").CircleState} state
 * @param {LogCorrectionRequest} request
 * @param {string} todayKey
 * @returns {{state: import("./circle-os-shell").CircleState, error: string, changed: boolean}}
 */
export function correctLogEntry(state, request, todayKey) {
  const fail = (error) => ({ state, error, changed: false });
  const { dateKey, blockId, id, expected, at } = request;
  if (!validDay(dateKey) || dateKey >= todayKey) return fail("Choose a past Log entry.");
  const day = state.days[dateKey];
  const block = day?.timeBlocks.find((item) => item.id === blockId);
  if (!id || !block) return fail("This entry is no longer here.");
  if (day.logCorrections?.[id]) return { state, error: "", changed: false };
  if (!expected || logBlockSignature(block) !== expected) return fail("This entry changed. Cancel and open it again.");
  if (typeof request.title !== "string" || !Array.isArray(request.moments) || request.moments.some((text) => typeof text !== "string")) return fail("Check the entry's words.");
  const { title, moments } = logEntryWords({ ...block, title: request.title, activity: request.title, note: "", moments: request.moments });
  const original = logEntryWords(block);
  if (title === original.title && JSON.stringify(moments) === JSON.stringify(original.moments)) return { state, error: "", changed: false };
  const timestamp = Date.parse(at);
  const previous = Date.parse(block.updatedAt || block.createdAt || "");
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== at || (Number.isFinite(previous) && timestamp <= previous)) return fail("This entry has a newer change. Cancel and open it again.");
  const after = { ...block, title, activity: title, moments, note: "", updatedAt: at };
  const receipt = { id, dateKey, blockId, correctedAt: at, before: structuredClone(block), after: structuredClone(after) };
  return {
    state: queueProfileUpdate({ ...state, days: { ...state.days, [dateKey]: {
      ...day,
      timeBlocks: title || moments.length
        ? day.timeBlocks.map((item) => item.id === blockId ? after : item)
        : day.timeBlocks.filter((item) => item.id !== blockId),
      logCorrections: { ...day.logCorrections, [id]: receipt },
    } } }, "day-log"),
    error: "", changed: true,
  };
}

function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** @param {string} value */
function circleMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour < CIRCLE_DAY_START_HOUR ? hour + 24 : hour) * 60 + minute;
}

/** Read saved Log content without creating days or applying today's routine.
 * @param {{ days?: Record<string, LogDay> }} state
 * @param {string} todayKey
 */
export function logHistoryDays(state, todayKey) {
  return Object.entries(state.days || {})
    .filter(([key]) => validDay(key) && key < todayKey)
    .map(([dateKey, day]) => ({
      dateKey,
      title: day.title || "",
      blocks: (day.timeBlocks || []).map((block) => ({
        id: block.id,
        start: block.start,
        end: block.end,
        title: block.title || block.activity || "",
        moments: block.moments?.length ? [...block.moments] : block.note ? [block.note] : [],
      })).filter((block) => block.title.trim() || block.moments.some((moment) => moment.trim()))
        .sort((left, right) => circleMinutes(left.start) - circleMinutes(right.start)),
    }))
    .filter((day) => day.title.trim() || day.blocks.length)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}

/** Format the assigned date, without moving it into the device's timezone.
 * @param {string} dateKey
 */
export function logHistoryWeekday(dateKey) {
  return new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" })
    .format(new Date(`${dateKey}T12:00:00Z`));
}
