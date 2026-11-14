import test from 'node:test';
import assert from 'node:assert/strict';
import { createTemplateDraft, createTemplatePage, fixedValue, validateTemplate, resolveTemplate, templateChapter } from '../app/os/admin/template-model.js';
import { chapterCompletion } from '../app/os/chapters/chapter-capabilities.js';
import { chapterDraftToMarkdown } from '../app/os/admin/chapter-authoring.js';
import { parseChapterMarkdown } from '../scripts/chapter-compiler.mjs';

export function example(kind='routine') {
  const d=createTemplateDraft(kind);d.template.title='Synthetic practice';d.template.items[0].action='Practice';
  const question=createTemplatePage('short-text');Object.assign(question,{question:'Choose your starting target',inputFormat:'number',min:0,max:50});
  d.template.pages.push(question);
  d.template.items[0].target={...fixedValue(),source:'answer',answerKey:question.answerKey};d.template.items[0].unit='repetitions';
  return d;
}

test('question errors identify the Page and distinguish wording from internal references',()=>{
 const d=example();d.template.pages[0].question='';d.template.pages[0].title='A title';
 assert.match(validateTemplate(d.template).join(' '),/Page 1: Write the question/);
 d.template.pages[0].question='When?';d.template.pages[0].answerKey='INVALID';
 assert.match(validateTemplate(d.template).join(' '),/Page 1: The internal answer reference is invalid/);
 const duplicate={...d.template.pages[0],id:'other-page'};d.template.pages[0].answerKey='same';duplicate.answerKey='same';d.template.pages.push(duplicate);
 assert.match(validateTemplate(d.template).join(' '),/Page 2: This question shares an answer reference/);
});
test('template answers personalize quantities without changing authored items or input records',()=>{
  const draft=example(),before=structuredClone(draft),key=draft.template.pages[0].answerKey;
  assert.deepEqual(validateTemplate(draft.template),[]);
  assert.equal(resolveTemplate(draft.template).items.length,0);
  const result=resolveTemplate(draft.template,{[key]:6});
  assert.deepEqual(result.errors,[]);assert.equal(result.items[0].target,'6');assert.equal(result.items[0].action,'Practice');
  assert.deepEqual(draft,before);
  assert.ok(resolveTemplate(draft.template,{[key]:51}).errors.length);
  assert.ok(resolveTemplate(draft.template,{[key]:'6'}).errors.length);
});
test('authored wording resolves slots without rewriting saved definitions',()=>{
 const draft=example();draft.template.items[0].actionPattern='Do {target} push-ups';const before=structuredClone(draft);
 assert.equal(resolveTemplate(draft.template,{[draft.template.pages[0].answerKey]:6}).items[0].action,'Do 6 push-ups');assert.deepEqual(draft,before);
 draft.template.items[0].actionPattern='{unsupported}';assert.ok(validateTemplate(draft.template).length);
});
test('blank or removed effort does not borrow an evening cue or answer',()=>{
 const draft=example(),key=draft.template.pages[0].answerKey;
 const cue=createTemplatePage('short-text');cue.question='When?';draft.template.pages.push(cue);
 draft.template.items[0].cue={...fixedValue(),source:'answer',answerKey:cue.answerKey};
 const answers={[key]:6,[cue.answerKey]:'evening'};
 assert.equal(resolveTemplate(draft.template,answers).items[0].intensity,'');
 draft.template.items[0].intensity={...fixedValue('   '),answerKey:cue.answerKey};
 assert.equal(resolveTemplate(draft.template,answers).items[0].intensity,'');
 draft.template.items[0].intensity={...fixedValue(),source:'answer',answerKey:cue.answerKey};
 assert.equal(resolveTemplate(draft.template,answers).items[0].intensity,'evening');
 draft.template.items[0].intensity=fixedValue();
 const item=resolveTemplate(draft.template,answers).items[0];
 assert.equal(item.intensity,'');assert.equal(item.cue,'evening');
});
test('authored calculations clamp finite targets and reject invalid or reflected sources',()=>{
  const d=example(),key=d.template.pages[0].answerKey;
  d.template.items[0].target={...fixedValue(),source:'scale',answerKey:key,factor:0.5,offset:1,min:2,max:10};
  assert.equal(resolveTemplate(d.template,{[key]:40}).items[0].target,'10');
  d.template.items[0].target.factor=Infinity;assert.ok(validateTemplate(d.template).length);
  d.template.items[0].target.factor=1;d.template.pages[0].purpose='reflection';assert.ok(validateTemplate(d.template).length);
});
test('choice rules cover every stable choice ID and allow distinct display labels',()=>{
  const d=example(),q=createTemplatePage('single-choice');q.question='Choose a cue';q.options=[{id:'morning',label:'Morning'},{id:'evening',label:'Evening'}];d.template.pages.push(q);
  d.template.items[0].cue={...fixedValue(),source:'choice',answerKey:q.answerKey,choices:[{answer:'morning',value:'After breakfast'},{answer:'evening',value:'After dinner'}]};
  const answers={[d.template.pages[0].answerKey]:3,[q.answerKey]:'evening'};
  assert.equal(resolveTemplate(d.template,answers).items[0].cue,'After dinner');
  d.template.items[0].cue.choices.pop();assert.ok(validateTemplate(d.template).length);
});
test('templates reject broken links, duplicate identities, invalid kinds and malformed JSON',()=>{
  for(const edit of [d=>d.template.pages.push(structuredClone(d.template.pages[0])),d=>d.template.items[0].kind='negotiable',d=>d.template.items[0].target.answerKey='missing',d=>d.template.pages[0].required=false,d=>d.template.pages[0].id='template-result',d=>d.template.pages[0].options={}]){
    const d=example();edit(d);if(d.template.pages[0].options && !Array.isArray(d.template.pages[0].options)) d.template.pages[0].type='single-choice';assert.ok(validateTemplate(d.template).length);
  }
  for(const value of [null,{},[],{schemaVersion:1,kind:'routine',title:'x',description:'',pages:[null],items:[null]}])assert.ok(validateTemplate(value).length);
  const p=example('protocol');assert.deepEqual(validateTemplate(p.template),[]);p.template.items[0].kind='negotiable';assert.ok(validateTemplate(p.template).length);
});
test('template player uses a shared immutable chapter shape with optional fields round-tripped',()=>{
  const d=example();d.template.pages[0].imagePlacement='after-text';
  const chapter=templateChapter(d);assert.equal(chapterCompletion(chapter),'swipe');assert.equal(chapter.designVersion,'glass-v1');
  const markdown=chapterDraftToMarkdown({...d,chapter});
  const parsed=parseChapterMarkdown(markdown,'synthetic.md');assert.equal(parsed.pages[1].inputFormat,'number');assert.equal(parsed.pages[1].imagePlacement,'after-text');
});
