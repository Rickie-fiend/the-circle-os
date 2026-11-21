import {COLOR_GROUPS} from './imprint-color-model.js';
import {colorBrightnessAt} from './imprint-growth-model.js';

export const PULSE_MS = 1500;
export const ACTIVITY_GROUPS = Object.freeze({
 'chapter-finished':'starting', 'note-saved':'notes', 'thought-sent':'thoughts',
 'habit-completed':'routine', 'task-completed':null, 'log-ended':'log-week', 'protocol-sealed':'protocol',
});
const time = value => {
 if (value == null || !Number.isFinite(new Date(value).getTime())) throw Error('A known activity time is required.');
 return new Date(value).getTime();
};
const identity = value => typeof value === 'string' && value.trim().length > 0;
export function activityDay(at) {
 const date = new Date(time(at));
 if (date.getHours() < 6) date.setDate(date.getDate()-1);
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function emptyActivity() { return {sources: [],receipts: []}; }

// Receipt metadata only. Production adapters must supply durable acceptance,
// original source attribution and stable operation IDs; this slice has no adapter.
export function acceptActivity(state, action) {
 const group = action.kind === 'task-completed'
  ? ({routine:'routine', week:'log-week'})[action.origin]
  : ACTIVITY_GROUPS[action.kind];
 if (!COLOR_GROUPS.includes(group) || action.accepted !== true || action.changed !== true || action.correction === true || action.draft === true) return {state,pulse:false};
 if (action.kind === 'note-saved' && (action.firstSave !== true || action.nonempty !== true)) return {state,pulse:false};
 if (action.kind === 'thought-sent' && action.nonempty !== true) return {state,pulse:false};
 const {owner, day, source, at, operation} = action;
 if (![owner,day,source,operation].every(identity) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Activity owner, source, operation and attributed day are required.');
 const applied = time(at);
 if(new Date(`${day}T12:00:00Z`).toISOString().slice(0,10)!==day)throw Error('A valid attributed day is required.');
 if (action.kind === 'log-ended' && (time(action.endAt) > applied || time(action.savedAt) > applied)) return {state,pulse:false};
 const previous = state.receipts.find(item => item.owner === owner && item.operation === operation);
 if (previous) {
  if (previous.source !== source || previous.group !== group || previous.day !== day || time(previous.at) !== applied) throw Error('An activity operation cannot change identity or time.');
  return {state,pulse:false};
 }
 // A source identifies one occurrence (task/habit + day, seal + day, or run).
 // It cannot acquire a second area through another completion surface.
 const existing=state.sources.find(item => item.owner===owner&&item.source===source);
 if(existing && (existing.status!=='undone'||!['habit-completed','task-completed','protocol-sealed'].includes(action.kind)||existing.group!==group||existing.day!==day))return {state,pulse:false};
 const receipt={owner,group,day,source,at:new Date(applied).toISOString(),operation};
 return {state:{sources:existing?state.sources.map(item=>item===existing?{...item,status:'active'}:item):[...state.sources,{...receipt,status:'active'}],receipts:[...state.receipts,receipt]},pulse:true};
}

export function changeActivitySource(state, owner, source, change) {
 if (!['trash','restore','undo','clear','delete','archive'].includes(change)) throw Error('Unknown activity lifecycle action.');
 return {...state,sources:state.sources.map(item => {
  if (item.owner !== owner || item.source !== source || item.status === 'deleted' || change === 'archive') return item;
  if (change === 'restore') return ['trash','undone','cleared'].includes(item.status) ? {...item,status:'active'} : item;
  return {...item,status:({trash:'trash',undo:'undone',clear:'cleared',delete:'deleted'})[change]};
 })};
}

export function activityContributions(state, owner, now) {
 const observed = time(now), groups = new Map();
 for (const item of state.sources) {
  if (item.owner !== owner || !COLOR_GROUPS.includes(item.group) || time(item.at) > observed) continue;
  const key = JSON.stringify([item.group,item.day]);
  if (!groups.has(key)) groups.set(key,[]);
  groups.get(key).push(item);
 }
 return [...groups.values()].filter(items => items.some(item => item.status === 'active')).map(items => {
  const original = items.reduce((first,item) => time(item.at) < time(first.at) ? item : first);
  return {group:original.group,day:original.day,at:original.at,sources:items.filter(item => item.status === 'active').map(item => item.source).sort(),brightness:colorBrightnessAt(original.at,now)};
 }).sort((a,b) => time(a.at)-time(b.at) || a.day.localeCompare(b.day) || a.group.localeCompare(b.group));
}

export function activityGrowthState(state, owner, now) {
 return growthFromContributions(activityContributions(state,owner,now));
}

export function growthFromContributions(contributions) {
 return Object.fromEntries(COLOR_GROUPS.map(group => {
  const layers = contributions.filter(item => item.group === group).map((item,index) => ({...item,spread:1-Math.exp(-(index+1)/22)}));
  return [group,{days:layers.length,spread:layers.at(-1)?.spread ?? 0,layers}];
 }));
}

export function activityPulse(elapsed, initial = 0, riseMs = 300) {
 if (elapsed < 0 || elapsed >= PULSE_MS) return 0;
 const q = elapsed/PULSE_MS, peak = riseMs/PULSE_MS, ease = x => x*x*(3-2*x);
 return q < peak ? initial+(1-initial)*ease(q/peak) : 1-ease((q-peak)/(1-peak));
}
