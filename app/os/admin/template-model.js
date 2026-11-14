import { createChapterDraft } from './chapter-authoring.js';

const idPattern = /^[a-z0-9][a-z0-9-]*$/;
const imagePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TEMPLATE_PAGE_TYPES = ['info', 'single-choice', 'multi-choice', 'short-text', 'long-text', 'time'];
/** @returns {import('./template-types').TemplateValue} */
export function fixedValue(value = '') {
  return { source: 'fixed', value, answerKey: '', factor: 1, offset: 0, min: 0, max: 1, choices: [] };
}
/** @returns {import('./template-types').TemplateItem} */
export function createTemplateItem(kind) {
  return { id: `item-${crypto.randomUUID()}`, kind, action: '', cue: fixedValue(), target: fixedValue(), intensity: fixedValue(), unit: '', identity: '' };
}
/** @returns {import('./template-types').TemplatePage} */
export function createTemplatePage(type = 'info') {
  const id = `page-${crypto.randomUUID()}`;
  return { id, type, title: '', body: '', question: '', answerKey: id, required: type !== 'info', purpose: type === 'info' ? 'content' : 'configuration', options: ['single-choice','multi-choice'].includes(type) ? [{id:'first',label:''},{id:'second',label:''}] : [] };
}
/** @returns {import('./template-types').TemplateDraft} */
export function createTemplateDraft(kind = 'routine') {
  return { ...createChapterDraft(), draftId: `template-${crypto.randomUUID()}`, template: {
    schemaVersion: 1, kind, title: '', description: '', pages: [], items: [createTemplateItem(kind === 'routine' ? 'habit' : 'non-negotiable')],
  } };
}

export function validateTemplate(template) {
  try { return validateTemplateContent(template); } catch { return ['Template fields are invalid. Check the questions, items and rules.']; }
}
function validateTemplateContent(template) {
  const errors = [];
  if (!template || template.schemaVersion !== 1 || !['routine','protocol'].includes(template.kind)) return ['Choose a template type.'];
  if (typeof template.title !== 'string' || !template.title.trim()) errors.push('Give the template an Explore name.');
  if (typeof template.description !== 'string') errors.push('Description must be text.');
  if (!Array.isArray(template.pages) || !Array.isArray(template.items) || !template.items.length) return [...errors, 'Add at least one item and a valid page list.'];
  const image = value => !value || (imagePattern.test(value.assetId || '') && typeof value.alt === 'string' && Boolean(value.alt.trim()) && (value.caption === undefined || typeof value.caption === 'string'));
  if (!image(template.cover)) errors.push('Cover needs a valid media reference and description.');
  const keys = new Map();
  const pageIds = new Set();
  for (const [index, page] of template.pages.entries()) {
    if (!page || !idPattern.test(page.id || '') || ['template-cover','template-result'].includes(page.id) || pageIds.has(page.id)) { errors.push('Pages need unique, non-reserved IDs.'); continue; }
    pageIds.add(page.id);
    if (['title','body','question'].some(field => page[field] !== undefined && typeof page[field] !== 'string')) errors.push('Page wording must be text.');
    if (!TEMPLATE_PAGE_TYPES.includes(page.type) || !['content','configuration','reflection','preview'].includes(page.purpose)) errors.push('Unsupported page.');
    if (!image(page.image) || (page.imagePlacement !== undefined && !['before-text','after-text'].includes(page.imagePlacement))) errors.push('Check page image and placement.');
    if (page.type !== 'info') {
      if (!page.question?.trim()) errors.push(`Page ${index+1}: Write the question the person will answer. Page title is optional and separate.`);
      if (!idPattern.test(page.answerKey || '')) errors.push(`Page ${index+1}: The internal answer reference is invalid. Recreate this question and relink its items.`);
      else if (keys.has(page.answerKey)) errors.push(`Page ${index+1}: This question shares an answer reference with another Page. Duplicate it using Duplicate Page, remove the conflicting Page and relink its items.`);
      keys.set(page.answerKey, page);
    } else if (!page.title?.trim() && !page.body?.trim() && !page.image && page.purpose !== 'preview') errors.push('An information page needs text or an image.');
    if (page.purpose === 'preview' && page.type !== 'info') errors.push('Preview pages must be information pages.');
    if (page.type !== 'info' && !['configuration','reflection'].includes(page.purpose)) errors.push('Questions must be configuration or reflection.');
    if (['single-choice','multi-choice'].includes(page.type)) {
      if (!Array.isArray(page.options) || page.options.length < 2 || page.options.some(o => !idPattern.test(o.id || '') || !o.label?.trim()) || new Set(page.options?.map(o => o.id)).size !== page.options?.length) errors.push('Choices need at least two unique, named options.');
    }
    if (page.inputFormat !== undefined && (page.inputFormat !== 'number' || page.type !== 'short-text' || !Number.isFinite(page.min) || !Number.isFinite(page.max) || page.min > page.max)) errors.push('Numeric questions need valid lower and upper bounds.');
  }
  const itemIds = new Set();
  for (const item of template.items) {
    if (!item || !idPattern.test(item.id || '') || itemIds.has(item.id)) { errors.push('Items need unique IDs.'); continue; }
    itemIds.add(item.id);
    if (item.actionPattern !== undefined && (typeof item.actionPattern !== 'string' || !item.actionPattern.trim() || /[{}]/.test(item.actionPattern.replace(/\{(target|unit|intensity)\}/g,'')))) errors.push('Action wording can use only target, unit and intensity slots.');
    if (typeof item.unit !== 'string' || typeof item.identity !== 'string') errors.push('Units and result wording must be text.');
    if (!(template.kind === 'routine' ? ['habit','task'] : ['non-negotiable','negotiable']).includes(item.kind) || !item.action?.trim()) errors.push('Give each item an action and valid type.');
    for (const [field,setting] of Object.entries({ cue: item.cue, target: item.target, intensity: item.intensity })) {
      if (!setting || !['fixed','answer','scale','choice'].includes(setting.source)) { errors.push('Choose a value source.'); continue; }
      if (typeof setting.value !== 'string') errors.push('Fixed values must be text.');
      const page = keys.get(setting.answerKey);
      if (setting.source !== 'fixed' && (!page || page.purpose !== 'configuration' || !page.required)) errors.push('Link settings to required configuration questions.');
      if (setting.source === 'scale' && (page?.inputFormat !== 'number' || ![setting.factor,setting.offset,setting.min,setting.max].every(Number.isFinite) || setting.min > setting.max || field !== 'target')) errors.push('A calculation needs a numeric question and finite target bounds.');
      if (setting.source === 'choice' && (page?.type !== 'single-choice' || !Array.isArray(setting.choices) || setting.choices.length !== page.options?.length || new Set(setting.choices.map(c => c.answer)).size !== setting.choices.length || setting.choices.some(c => !page.options?.some(o => o.id === c.answer) || typeof c.value !== 'string' || !c.value.trim()))) errors.push('Provide one result for every single-choice option.');
      if (field === 'target' && setting.source === 'answer' && page?.inputFormat !== 'number') errors.push('A target answer must come from a numeric question.');
      if (field === 'target' && setting.source === 'fixed' && setting.value !== '' && (!Number.isFinite(Number(setting.value)) || Number(setting.value) < 0)) errors.push('A target must be a non-negative number.');
      if (field === 'target' && setting.source === 'choice' && setting.choices?.some(c => !Number.isFinite(Number(c.value)) || Number(c.value) < 0)) errors.push('Choice targets must be non-negative numbers.');
      if (field === 'target' && setting.source === 'scale' && setting.min < 0) errors.push('Target bounds cannot be negative.');
    }
  }
  if (template.kind === 'protocol' && !template.items.some(i => i.kind === 'non-negotiable')) errors.push('Add at least one non-negotiable.');
  return errors;
}

/** @returns {{items:import('./template-types').ResolvedTemplateItem[],errors:string[]}} */
export function resolveTemplate(template, answers = {}) {
  const errors = validateTemplate(template);
  const valueFor = setting => {
    if (setting.source === 'fixed') return setting.value;
    const page = template.pages.find(p => p.answerKey === setting.answerKey);
    const value = Object.hasOwn(answers, setting.answerKey) ? answers[setting.answerKey] : undefined;
    if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) throw Error(`Answer “${page?.question || 'the linked question'}” to see this result.`);
    if (page?.inputFormat === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || value < page.min || value > page.max)) throw Error('Enter a number within the question bounds.');
    if (setting.source === 'scale') {
      const result = value * setting.factor + setting.offset;
      if (!Number.isFinite(result)) throw Error('This calculation has no finite result.');
      return String(Math.min(setting.max, Math.max(setting.min, result)));
    }
    if (setting.source === 'choice') {
      const found = setting.choices.find(c => c.answer === value);
      if (!found) throw Error('Choose one of the listed options.');
      return found.value;
    }
    if (page?.type === 'time') {
      if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw Error('Choose a valid time.');
      const hour=Number(value.slice(0,2));return `${hour%12||12}:${value.slice(3)} ${hour<12?'AM':'PM'}`;
    }
    if (['single-choice','multi-choice'].includes(page?.type)) {
      const selected = Array.isArray(value) ? value : [value];
      if (selected.some(id => !page.options.some(o => o.id === id))) throw Error('Choose listed options.');
      return selected.map(id => page.options.find(o => o.id === id).label).join(', ');
    }
    if (!['string','number'].includes(typeof value)) throw Error('Answer has the wrong type.');
    return String(value);
  };
  if (errors.length) return { items: [], errors };
  const items = template.items.map(item => {
    try { const target=valueFor(item.target),intensity=valueFor(item.intensity).trim();const slots={target,unit:item.unit,intensity}; return { id: item.id, kind: item.kind, action: item.actionPattern ? item.actionPattern.replace(/\{(target|unit|intensity)\}/g,(_,key)=>slots[key]).replace(/\s+/g,' ').trim() : item.action, cue: valueFor(item.cue), target, unit: item.unit, intensity, identity: item.identity, actionPattern:item.actionPattern }; }
    catch (cause) { errors.push(cause.message); return null; }
  }).filter(Boolean);
  return { items, errors };
}

export function routineTemplateCue(item) {
  return [!item.actionPattern && item.target !== '' ? `${item.target} ${item.unit}`.trim() : '', item.intensity, item.cue].filter(Boolean).join(' · ');
}

/** @returns {import('../chapters/chapter-types').ChapterDefinition} */
export function templateChapter(draft) {
  const t = draft.template;
  return { ...draft.chapter, id: draft.draftId, title: t.title || 'Template preview', purpose: t.description || 'Template setup', pages: [
    { id: 'template-cover', type: 'cover', title: t.title || 'Template preview', body: t.description, image: t.cover },
    ...t.pages.map(page => { const copy = {...page}; delete copy.purpose; return copy; }),
    { id: 'template-result', type: 'result', title: t.kind==='routine'?'Routine':'Protocol' },
  ] };
}
