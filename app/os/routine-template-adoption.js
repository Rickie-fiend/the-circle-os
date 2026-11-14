import { addHabitDefinition, updateHabitDefinitionParts, addTask, updateTask, setRoutineSchedule, getDateKey } from './circle-os-model.js';
import { routineTemplateCue } from './admin/template-model.js';
import { confirmedTemplate, templateSourceSnapshot } from './template-adoption-record.js';

export function activeRoutineTemplate(state, sourceId, day = getDateKey()) {
  return Object.values(state.templateAdoptions || {}).find(source => source.id === sourceId && source.records.some(({ id, kind }) => {
    const record = kind === 'habit' ? state.habits.definitions[id] : state.tasks.items[id];
    if (!record || !['active', 'open'].includes(record.status) || (record.schedule?.end && record.schedule.end < day)) return false;
    if (record.schedule?.mode !== 'once') return true;
    const completions = kind === 'habit' ? state.habits.completions : state.tasks.completions;
    return !Object.values(completions || {}).some(completion => (completion.habitId || completion.taskId) === id && completion.completed && completion.dateKey >= record.schedule.start);
  }));
}

/** Adds a confirmed group atomically to the existing local domain records. */
export function addRoutineTemplate(state, { template, sourceId, version, operationId, ongoing = false, answers = {}, dateKey = getDateKey() }) {
  if (typeof sourceId !== 'string' || !sourceId.trim() || sourceId.length > 200 || !Number.isInteger(version) || version < 1 || !/^[-a-zA-Z0-9]{1,128}$/.test(operationId || '')) throw Error('This template version is unavailable.');
  const id = 'routine-' + operationId;
  const prior = state.templateAdoptions?.[id];
  if (prior) {
    if (prior.id !== sourceId || prior.version !== version) throw Error('This add request belongs to another template.');
    return { state, id };
  }
  const active = activeRoutineTemplate(state, sourceId, dateKey);
  if (active) return { state, id: 'routine-' + active.operationId };
  if (template?.kind !== 'routine' || typeof ongoing !== 'boolean') throw Error('Choose a valid Habit template schedule.');
  const result = confirmedTemplate(template, answers);
  const records = result.items.map(item => ({ id: id + '-' + item.id, kind: item.kind }));
  for (const [index, item] of result.items.entries()) {
    if (!item.action.trim() || item.action.length > 240 || routineTemplateCue(item).length > 120 || item.identity.length > 120) throw Error('An item is too long for Routine. Ask the author to shorten its wording.');
    if (state.habits.definitions[records[index].id] || state.tasks.items[records[index].id]) throw Error('An item already uses this add request. Open Routine to review it.');
  }
  let next = state;
  for (const [index, item] of result.items.entries()) {
    const recordId = records[index].id;
    if (item.kind === 'habit') {
      next = addHabitDefinition(next, recordId).state;
      next = updateHabitDefinitionParts(next, recordId, { action: item.action, cue: routineTemplateCue(item), identity: item.identity });
      next = { ...next, habits: { ...next.habits, definitions: { ...next.habits.definitions, [recordId]: { ...next.habits.definitions[recordId], templateAdoptionId: id } } } };
    } else {
      next = updateTask(addTask(next, recordId).state, recordId, item.action);
      next = { ...next, tasks: { ...next.tasks, items: { ...next.tasks.items, [recordId]: { ...next.tasks.items[recordId], cue: routineTemplateCue(item), identity: item.identity, templateAdoptionId: id } } } };
    }
    next = setRoutineSchedule(next, item.kind, recordId, ongoing ? 'ongoing' : 'daily', 21, dateKey);
  }
  const adoptedAt = new Date().toISOString();
  const source = { ...templateSourceSnapshot(template, result, answers, { sourceId, version, operationId, adoptedAt }), records, schedule: structuredClone((records[0].kind === 'habit' ? next.habits.definitions : next.tasks.items)[records[0].id].schedule), updatedAt: adoptedAt };
  return { state: { ...next, templateAdoptions: { ...next.templateAdoptions, [id]: source } }, id };
}
