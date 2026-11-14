import { resolveTemplate } from './admin/template-model.js';

export function confirmedTemplate(template, answers) {
  const result = resolveTemplate(template, answers);
  if (result.errors.length) throw Error(result.errors[0]);
  for (const page of template.pages.filter(page => page.type !== 'info')) {
    const value = answers[page.answerKey];
    const empty = value === undefined || value === '' || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
    if (empty) { if (page.required) throw Error('Answer “' + page.question + '” before continuing.'); continue; }
    const valid = page.inputFormat === 'number' ? typeof value === 'number' && Number.isFinite(value) && value >= page.min && value <= page.max
      : page.type === 'time' ? typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
        : page.type === 'single-choice' ? page.options.some(option => option.id === value)
          : page.type === 'multi-choice' ? Array.isArray(value) && new Set(value).size === value.length && value.every(id => page.options.some(option => option.id === id))
            : typeof value === 'string' && value.length <= (page.type === 'long-text' ? 4000 : 1200);
    if (!valid) throw Error('Check your answer to “' + page.question + '”.');
  }
  return result;
}

export function templateSourceSnapshot(template, result, answers, { sourceId, version, operationId, adoptedAt }) {
  return {
    id: sourceId, version, operationId, adoptedAt, title: template.title,
    items: structuredClone(result.items),
    answers: template.pages.filter(page => page.type !== 'info' && Object.hasOwn(answers, page.answerKey) && answers[page.answerKey] !== undefined && answers[page.answerKey] !== '' && (typeof answers[page.answerKey] !== 'string' || answers[page.answerKey].trim()) && (!Array.isArray(answers[page.answerKey]) || answers[page.answerKey].length)).map(page => {
      const value = answers[page.answerKey];
      const displaySnapshot = ['single-choice', 'multi-choice'].includes(page.type)
        ? (Array.isArray(value) ? value : [value]).map(id => page.options.find(option => option.id === id)?.label || id).join(', ')
        : String(value);
      return { pageId: page.id, answerKey: page.answerKey, question: page.question, purpose: page.purpose, value: structuredClone(value), displaySnapshot, answeredAt: adoptedAt };
    }),
  };
}
