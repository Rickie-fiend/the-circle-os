import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../app/os/circle-os-model.js';
import { makeSchedule, scheduleActive } from '../app/os/routine-schedule.js';

test('periods use inclusive Circle dates, validate input, and once has no expiry', () => {
  const s = makeSchedule('daily', '2026-12-20', 21);
  assert.equal(s.end, '2027-01-09');
  assert.equal(scheduleActive(s, '2027-01-09'), true);
  assert.equal(scheduleActive(s, '2027-01-10'), false);
  assert.equal(scheduleActive(s, '2026-12-19'), false);
  assert.equal(scheduleActive(makeSchedule('once', '2026-01-01'), '2027-01-01'), true);
  for (const count of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => makeSchedule('daily', '2026-01-01', count));
  assert.throws(() => makeSchedule('daily', '2026-02-30'));
  assert.equal(m.getDateKey(new Date(2026, 0, 2, 5, 59)), '2026-01-01');
  assert.equal(m.getDateKey(new Date(2026, 0, 2, 6, 0)), '2026-01-02');
});

test('repeating tasks tick per day, preserve wording, undo and archive through reload and stale merge', () => {
  let s = m.updateTask(m.addTask(m.createEmptyState(), 't').state, 't', 'Read five pages');
  s = m.setRoutineSchedule(s, 'task', 't', 'daily', 2, '2026-01-01');
  const stale = structuredClone(s);
  s = m.completeTask(s, 't', '2026-01-01');
  assert.equal(s.tasks.items.t.status, 'open');
  s = m.updateTask(s, 't', 'Read ten pages');
  s = m.completeTask(s, 't', '2026-01-02');
  assert.equal(m.dayRecord(s, '2026-01-01').tasks[0].text, 'Read five pages');
  assert.equal(m.dayRecord(s, '2026-01-02').tasks[0].text, 'Read ten pages');
  assert.equal(m.completeTask(s, 't', '2026-01-03'), s);
  s = m.reopenTask(s, 't', '2026-01-02');
  s = m.archiveTask(s, 't');
  s = m.normalizeState(m.mergeServerState(s, stale));
  assert.equal(s.tasks.items.t.status, 'archived');
  assert.equal(m.dayRecord(s, '2026-01-02').tasks.length, 0);
  assert.equal(m.habitHistoryRecord(s, '2026-01-01').tasks[0].text, 'Read five pages');
});

test('once habits stay pending until ticked; daily habits expire without changing history', () => {
  let s = m.updateHabitDefinition(m.addHabitDefinition(m.createEmptyState(), 'h').state, 'h', 'Walk');
  s = m.setRoutineSchedule(s, 'habit', 'h', 'once', 21, '2026-01-01');
  assert.equal(m.routineHabitVisible(s, s.habits.definitions.h, '2026-01-15'), true);
  s = m.toggleHabitForDay(s, 'h', '2026-01-15');
  assert.equal(m.routineHabitVisible(s, s.habits.definitions.h, '2026-01-16'), false);
  s = m.setRoutineSchedule(s, 'habit', 'h', 'daily', 2, '2026-01-16');
  assert.equal(m.routineHabitVisible(s, s.habits.definitions.h, '2026-01-18'), false);
  assert.equal(m.habitHistoryRecord(m.normalizeState(s), '2026-01-15').habits[0].text, 'Walk');
});

test('legacy defaults and Week-linked steps retain their original behavior', () => {
  let s = m.addTask(m.createEmptyState(), 't').state;
  assert.equal(s.tasks.items.t.schedule, undefined);
  const done = m.completeTask(s, 't');
  assert.equal(done.tasks.items.t.status, 'completed');
  s.goals.steps.example = { id: 'example', taskId: 't', goalId: 'g', dateKey: '2026-01-01' };
  assert.equal(m.setRoutineSchedule(s, 'task', 't', 'daily', 21, '2026-01-01'), s);
});
