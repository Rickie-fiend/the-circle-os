/** @param {string} at @param {string} timeZone */
export function imprintFadeAt(at, timeZone) {
  const dayMs = 86_400_000;
  const eligible = Date.parse(at) + dayMs;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  });
  const wallTime = (instant) => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, Number(value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  };
  const wallEligible = wallTime(eligible) + (eligible % 1000);
  const date = new Date(wallEligible);
  date.setUTCHours(6, 0, 0, 0);
  const target = date.getTime() < wallEligible ? date.getTime() + dayMs : date.getTime();
  // Find the first instant at the chosen local cutoff. Searching in real time
  // keeps the elapsed-day rule across offset changes and skipped wall times.
  let low = Math.floor(eligible / 1000);
  let high = low + 3 * dayMs / 1000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (wallTime(mid * 1000) < target) low = mid + 1;
    else high = mid;
  }
  return low * 1000;
}
