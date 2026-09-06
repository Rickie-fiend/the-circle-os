/**
 * What a day costs.
 *
 * Athena's other memory counts how often a thing happened. Counting answers
 * "did this happen"; it cannot answer "what is this taking". A life can be
 * spent on something for a fifth of its recorded hours and still read as a
 * pleasant habit when it is only ever tallied.
 *
 * Pricing is deterministic arithmetic over recorded hour blocks. It runs with
 * no server, no model, and no network, so the phone and the morning
 * preparation always agree about the numbers and only differ about the words.
 */

/**
 * A block belongs to a category when its activity, its note, or any of its
 * moments matches. Reading only the activity loses the meaning: a walk whose
 * moment is "Smoke" is both movement and smoking, and only the title is
 * visible from the outside.
 *
 * Categories deliberately overlap. `share` is therefore a share of recorded
 * hours per category, not a slice of a pie, and the shares do not sum to 100.
 */
export const PRICING_CATEGORIES = [
  { id: "walking", label: "Walking and outdoors", match: /\b(?:walk|outdoor|patio|balcony|stroll)/i },
  { id: "smoking", label: "Smoking", match: /\b(?:smoke|smoking|cigarette|weed)\b/i },
  { id: "making", label: "Project and creative work", match: /\b(?:project|coding|comput|software|os|build|content|edit|writing|admin mode|codex|claude)\b/i },
  { id: "training", label: "Gym and training", match: /\b(?:gym|workout|work out|training|exercise|run)\b/i },
  { id: "eating", label: "Meals", match: /\b(?:lunch|dinner|breakfast|brunch|eat|meal|food|coffee|tea)\b/i },
  { id: "people", label: "Time with people", match: /\b(?:mom|mother|family|cousin|friend|bros|girlfriend|dad|father|sister|brother|call)\b/i },
  { id: "reading", label: "Reading", match: /\b(?:read|book|chapter)/i },
  { id: "practice", label: "Practice and study", match: /\b(?:speak|english|class|study|practice|language|lesson)/i },
  { id: "stillness", label: "Meditation and journaling", match: /\b(?:meditat|journal|write|beads|breath|reflect|pray|pagoda|temple)/i },
  { id: "entertainment", label: "Films and games", match: /\b(?:movie|film|dota|game|youtube|series|show|watch)(?:s|es|ing)?\b/i },
  { id: "rest", label: "Sleep and waking", match: /\b(?:sleep|wake ?up|woke|nap|bed)\b/i },
  { id: "upkeep", label: "Errands and upkeep", match: /\b(?:shower|clean|wash|dish|market|shop|laundry|errand|immigration|fix|cook)/i },
];

/**
 * The four parts of a life he is building toward, from his own method:
 * character > habits > protocol > goal > daily, with the character named
 * across Mind, Body, Spirit and Social.
 *
 * Categories are engineering. Dimensions are his vocabulary. Pricing answers
 * "where did the hours go"; the roll-up answers "which part of myself did I
 * feed", which is the only version of that question he can act on.
 */
export const DIMENSIONS = Object.freeze([
  { id: "mind", label: "Mind" },
  { id: "body", label: "Body" },
  { id: "spirit", label: "Spirit" },
  { id: "social", label: "Social" },
]);

/**
 * Judgement, not arithmetic — which is why it lives in one visible table
 * instead of being scattered through the code.
 *
 * A counted category with no dimension is **outside the four**: real hours
 * that feed no part of the character he named. That is reported plainly and
 * never scored. Smoking and screen time sit there on purpose; calling either
 * one a failing is his call to make, not the model's.
 *
 * Once a habit carries its trait (Phase C), his own trait wins over this
 * table. This is the default until he has said otherwise.
 */
export const CATEGORY_DIMENSION = Object.freeze({
  making: "mind",
  reading: "mind",
  practice: "mind",
  walking: "body",
  training: "body",
  stillness: "spirit",
  people: "social",
});

/**
 * Not a dimension and not outside it: simply not something a person feeds a
 * part of themselves with. Sleeping and eating are how a body runs, not how it
 * is chosen. Auditing them would be the scoring this app refuses.
 */
export const UNCOUNTED_CATEGORIES = Object.freeze(["rest", "eating", "upkeep"]);

const UNCOUNTED = new Set(UNCOUNTED_CATEGORIES);

const MINUTES_IN_HOUR = 60;

function minutesFromClock(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * MINUTES_IN_HOUR + minutes;
}

/** A block that ends before it starts crossed midnight; it did not last -23h. */
function blockMinutes(block) {
  const start = minutesFromClock(block?.start);
  const end = minutesFromClock(block?.end);
  if (start === null || end === null) return 0;
  const span = end - start;
  return span > 0 ? span : span + 24 * MINUTES_IN_HOUR;
}

/** Everything the person wrote on one block, title and notes alike. */
export function blockText(block) {
  return [
    block?.activity,
    block?.title,
    block?.note,
    ...(Array.isArray(block?.moments) ? block.moments : []),
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" · ");
}

function categoriesFor(text, categories) {
  return categories.filter((category) => category.match.test(text)).map((c) => c.id);
}

function round(value, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function emptyTotals() {
  return { minutes: 0, blocks: 0, days: new Set() };
}

/**
 * @param {Array<{date?: string, timeBlocks?: Array<object>}>} days
 * @returns {{recordedDays: number, blocks: number, hours: number, totals: Map<string, {minutes: number, blocks: number, days: Set<string>}>}}
 */
function tally(days, categories, dimensionOf) {
  const totals = new Map(categories.map((category) => [category.id, emptyTotals()]));
  const dimensions = new Map(DIMENSIONS.map((dimension) => [dimension.id, emptyTotals()]));
  let directedMinutes = 0;
  let blocks = 0;
  let minutes = 0;
  let recordedDays = 0;

  for (const day of Array.isArray(days) ? days : []) {
    const dayBlocks = Array.isArray(day?.timeBlocks) ? day.timeBlocks : [];
    if (!dayBlocks.length) continue;
    recordedDays += 1;
    for (const block of dayBlocks) {
      const span = blockMinutes(block);
      if (!span) continue;
      blocks += 1;
      minutes += span;
      const text = blockText(block);
      if (!text) continue;
      const matched = categoriesFor(text, categories);
      for (const id of matched) {
        const total = totals.get(id);
        total.minutes += span;
        total.blocks += 1;
        if (day.date) total.days.add(day.date);
      }

      // An hour is only ever spent once. Categories overlap by design, so a
      // walk to the gym matches both `walking` and `training` — but it is one
      // hour of Body, not two. Dimensions are collected as a set per block.
      const counted = matched.filter((id) => !UNCOUNTED.has(id));
      if (counted.length) directedMinutes += span;
      const reached = new Set(counted.map(dimensionOf).filter(Boolean));
      for (const id of reached) {
        const total = dimensions.get(id);
        total.minutes += span;
        total.blocks += 1;
        if (day.date) total.days.add(day.date);
      }
    }
  }

  return {
    recordedDays,
    blocks,
    hours: minutes / MINUTES_IN_HOUR,
    directedHours: directedMinutes / MINUTES_IN_HOUR,
    totals,
    dimensions,
  };
}

function sortedDays(days) {
  return (Array.isArray(days) ? days : [])
    .filter((day) => day && Array.isArray(day.timeBlocks) && day.timeBlocks.length)
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));
}

/**
 * Which dimension a category feeds.
 *
 * His own trait on a habit wins when it exists (Phase C); the table is only
 * the default until he has said otherwise. Returns null for a category that
 * feeds none of the four, which is a finding rather than a gap.
 */
function dimensionResolver(options = {}) {
  const overrides = options.traitByCategory || {};
  return (categoryId) => overrides[categoryId] || CATEGORY_DIMENSION[categoryId] || null;
}

/**
 * The Circle week runs Monday to Sunday. Anchoring at midday keeps the sum
 * clear of daylight-saving boundaries, matching `week-app-model.js`; the
 * Monday itself is the caller's to decide, so this module stays free of the
 * app's state and can run anywhere.
 */
function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function inRange(day, from, to) {
  const key = String(day?.date || "");
  return key >= from && key <= to;
}

function priceWindows(current, previous, options) {
  const categories = options.categories || PRICING_CATEGORIES;
  const dimensionOf = dimensionResolver(options);

  const now = tally(current, categories, dimensionOf);
  const before = tally(previous, categories, dimensionOf);

  const rate = (minutes, days) => (days ? minutes / MINUTES_IN_HOUR / days : 0);

  const priced = categories
    .map((category) => {
      const total = now.totals.get(category.id);
      const past = before.totals.get(category.id);
      const hours = total.minutes / MINUTES_IN_HOUR;
      const perDay = rate(total.minutes, now.recordedDays);
      const pastPerDay = rate(past.minutes, before.recordedDays);
      return {
        id: category.id,
        label: category.label,
        blocks: total.blocks,
        hours: round(hours),
        hoursPerRecordedDay: round(perDay, 2),
        share: now.hours ? round((hours / now.hours) * 100) : 0,
        daysPresent: total.days.size,
        daysShare: now.recordedDays
          ? round((total.days.size / now.recordedDays) * 100)
          : 0,
        previousHoursPerRecordedDay: round(pastPerDay, 2),
        changePerDay: before.recordedDays ? round(perDay - pastPerDay, 2) : null,
      };
    })
    .filter((category) => category.blocks > 0)
    .sort((left, right) => right.hours - left.hours);

  const dimensions = DIMENSIONS.map((dimension) => {
    const total = now.dimensions.get(dimension.id);
    const past = before.dimensions.get(dimension.id);
    const hours = total.minutes / MINUTES_IN_HOUR;
    const perDay = rate(total.minutes, now.recordedDays);
    const pastPerDay = rate(past.minutes, before.recordedDays);
    return {
      id: dimension.id,
      label: dimension.label,
      hours: round(hours),
      hoursPerRecordedDay: round(perDay, 2),
      // Share of directed hours, not of the whole log: sleeping and eating
      // are not a part of himself he chose to feed, so they never dilute it.
      share: now.directedHours ? round((hours / now.directedHours) * 100) : 0,
      daysPresent: total.days.size,
      previousHoursPerRecordedDay: round(pastPerDay, 2),
      changePerDay: before.recordedDays ? round(perDay - pastPerDay, 2) : null,
      fed: total.minutes > 0,
    };
  });

  // Real hours feeding none of the four. Named, never scored.
  const outside = priced.filter(
    (category) => !UNCOUNTED.has(category.id) && !dimensionOf(category.id),
  );

  return {
    computedAt: options.now || null,
    recordedDays: now.recordedDays,
    from: current[0]?.date || null,
    to: current.at(-1)?.date || null,
    blocks: now.blocks,
    recordedHours: round(now.hours),
    directedHours: round(now.directedHours),
    hoursLoggedPerDay: now.recordedDays ? round(now.hours / now.recordedDays, 1) : 0,
    overlapping: true,
    categories: priced,
    dimensions,
    outside,
  };
}

/**
 * Prices one Circle week against the week before it.
 *
 * `mondayKey` is the week's Monday, from `weekStartKey` in `week-app-model.js`.
 * It is passed in rather than derived so this module never has to import the
 * app's state, and so there is only one place that decides when a week starts.
 */
export function priceWeek(days, mondayKey, options = {}) {
  const ordered = sortedDays(days);
  const sunday = addDays(mondayKey, 6);
  const previousMonday = addDays(mondayKey, -7);

  return {
    ...priceWindows(
      ordered.filter((day) => inRange(day, mondayKey, sunday)),
      ordered.filter((day) => inRange(day, previousMonday, addDays(mondayKey, -1))),
      options,
    ),
    weekOf: mondayKey,
    windowDays: 7,
  };
}

/**
 * Prices a window of recorded days, and the window of equal length before it
 * so a category can be said to be rising or falling rather than merely large.
 *
 * @param {Array<object>} days recorded days, newest or oldest first
 * @param {{windowDays?: number, categories?: Array<object>, now?: string}} options
 */
export function priceDays(days, options = {}) {
  const windowDays = Math.max(1, Number(options.windowDays) || 14);
  const ordered = sortedDays(days);

  return {
    ...priceWindows(
      ordered.slice(-windowDays),
      ordered.slice(-windowDays * 2, -windowDays),
      options,
    ),
    windowDays,
  };
}

/**
 * How many times one category outweighs another, for a sentence like
 * "four times the hours you gave the thing you are building".
 * Null when either side is missing, so a ratio is never invented.
 */
export function pricingRatio(pricing, leftId, rightId) {
  const find = (id) => pricing?.categories?.find((category) => category.id === id);
  const left = find(leftId);
  const right = find(rightId);
  if (!left || !right || !right.hours) return null;
  return round(left.hours / right.hours);
}

export function serializePricingMarkdown(pricing) {
  if (!pricing?.categories?.length) return "Not enough recorded days to price yet.";
  const head = `Over ${pricing.recordedDays} recorded days (${pricing.from} to ${pricing.to}), ${pricing.recordedHours} hours were logged, about ${pricing.hoursLoggedPerDay} hours a day. Categories overlap, so shares do not add to 100.`;
  const rows = pricing.categories.map((category) => {
    const change =
      category.changePerDay === null
        ? ""
        : category.changePerDay === 0
          ? "; level"
          : `; ${category.changePerDay > 0 ? "up" : "down"} ${Math.abs(category.changePerDay)}h a day`;
    return `- ${category.label} — ${category.hours}h, ${category.share}% of logged time, ${category.hoursPerRecordedDay}h a day, on ${category.daysPresent} of ${pricing.recordedDays} days${change}`;
  });
  return [head, "", ...rows].join("\n");
}
