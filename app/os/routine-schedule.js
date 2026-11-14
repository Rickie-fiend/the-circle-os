// Dates are attributed Circle days, supplied by the caller's 06:00 clock.
export function scheduleActive(schedule, day) {
  return !schedule || (day >= schedule.start && (!schedule.end || day <= schedule.end));
}

export function makeSchedule(mode, start, days = 21) {
  if (!['once', 'daily', 'ongoing'].includes(mode)) throw new Error('Choose a schedule.');
  const date = new Date(`${start}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== start) throw new Error('Choose a valid start day.');
  if (mode === 'daily' && (!Number.isSafeInteger(days) || days < 1)) throw new Error('Enter a whole number of days, at least 1.');
  if (mode === 'daily') date.setUTCDate(date.getUTCDate() + days - 1);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() > 9999) throw new Error('Choose a shorter period.');
  return { mode, start, end: mode === 'daily' ? date.toISOString().slice(0, 10) : null, days: mode === 'daily' ? days : null };
}
