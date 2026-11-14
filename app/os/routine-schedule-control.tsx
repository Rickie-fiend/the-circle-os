import { useState } from 'react';
import { makeSchedule } from './routine-schedule.js';

export type RoutineSchedule = { mode: string; start: string; end: string | null; days: number | null };
export function RoutineScheduleControl({ schedule, defaultMode, day, onChange }: { schedule?: RoutineSchedule; defaultMode: string; day: string; onChange: (mode: string, days: number) => void }) {
  const [days, setDays] = useState(String(schedule?.days || 21));
  const [error, setError] = useState('');
  function change(mode: string, value = days) {
    try { makeSchedule(mode, day, Number(value)); onChange(mode, Number(value)); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Choose a valid schedule.'); }
  }
  return <details className="os-routine-schedule"><summary>Schedule</summary>
    <label>Repeat<select aria-label="Repeat" value={schedule?.mode || defaultMode} onChange={event => change(event.target.value)}>
      <option value="once">Once</option><option value="daily">Daily for a period</option><option value="ongoing">Daily until stopped</option>
    </select></label>
    {schedule?.mode === 'daily' && <label>Number of days<input aria-label="Number of days" type="number" min="1" step="1" value={days} onChange={event => setDays(event.target.value)} onBlur={() => change('daily')} /></label>}
    {schedule?.end && <p>Through {schedule.end}</p>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
