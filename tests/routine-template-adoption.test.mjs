import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyState, normalizeState, mergeServerState, addHabitDefinition, updateHabitDefinitionParts, archiveHabitDefinition, archiveTask, toggleHabitForDay, completeTask } from '../app/os/circle-os-model.js';
import { createTemplateDraft, createTemplateItem, createTemplatePage, fixedValue } from '../app/os/admin/template-model.js';
import { addRoutineTemplate, activeRoutineTemplate } from '../app/os/routine-template-adoption.js';

function fixture() {
  let state=createEmptyState();state=updateHabitDefinitionParts(addHabitDefinition(state,'existing').state,'existing',{action:'Existing practice'});state.habits.identity.text='My chosen identity';
  const template=createTemplateDraft().template;template.title='A small group';template.items[0].action='Read a page';template.items[0].cue=fixedValue('After breakfast');template.items[0].identity='A reader';
  template.items.push({...createTemplateItem('task'),action:'Water a plant',cue:fixedValue('At 7 AM')});
  const question={...createTemplatePage('single-choice'),question:'Why this practice?',purpose:'reflection',options:[{id:'slow',label:'Slow down'},{id:'learn',label:'Keep learning'}]};template.pages.push(question);
  return {state,input:{template,sourceId:'synthetic-group',version:1,operationId:'synthetic-adoption',ongoing:false,answers:{[question.answerKey]:'slow'},dateKey:'2026-11-14'}};
}

test('Routine adoption adds the confirmed group without replacing identity, existing items or evidence',()=>{
  const{state,input}=fixture(),before=structuredClone(state),result=addRoutineTemplate(state,input),source=result.state.templateAdoptions[result.id];
  assert.deepEqual(state,before);assert.deepEqual(result.state.habits.definitions.existing,before.habits.definitions.existing);assert.deepEqual(result.state.habits.identity,before.habits.identity);
  assert.equal(source.records.length,2);assert.deepEqual(source.schedule,{mode:'daily',start:'2026-11-14',end:'2026-12-04',days:21});
  const habit=result.state.habits.definitions[source.records[0].id],task=result.state.tasks.items[source.records[1].id];
  assert.equal(habit.action,'Read a page');assert.equal(habit.cue,'After breakfast');assert.equal(habit.identity,'A reader');assert.equal(task.cue,'At 7 AM');assert.deepEqual(task.schedule,habit.schedule);
  assert.equal(source.answers[0].displaySnapshot,'Slow down');assert.equal(source.answers[0].value,'slow');
  assert.deepEqual(result.state.habits.completions,{});assert.deepEqual(result.state.tasks.completions||{},{});assert.deepEqual(result.state.chapters,state.chapters);
  input.template.items[0].action='Changed in catalog';input.template.pages[0].options[0].label='Changed label';assert.equal(source.items[0].action,'Read a page');assert.equal(source.answers[0].displaySnapshot,'Slow down');
  assert.deepEqual(normalizeState(result.state).templateAdoptions, result.state.templateAdoptions);assert.deepEqual(mergeServerState(state,result.state).templateAdoptions,result.state.templateAdoptions);
});

test('ongoing groups use daily records and stopping one item leaves the others intact',()=>{
  const{state,input}=fixture(),result=addRoutineTemplate(state,{...input,ongoing:true}),source=result.state.templateAdoptions[result.id];
  assert.equal(source.schedule.mode,'ongoing');assert.equal(source.schedule.end,null);
  let next=toggleHabitForDay(result.state,source.records[0].id,input.dateKey);next=completeTask(next,source.records[1].id,input.dateKey);
  assert.equal(next.tasks.items[source.records[1].id].status,'open');assert.equal(Object.values(next.tasks.completions)[0].completed,true);
  next=archiveHabitDefinition(next,source.records[0].id);assert.ok(activeRoutineTemplate(next,input.sourceId,'2026-12-20'));assert.equal(next.tasks.items[source.records[1].id].status,'open');
  assert.deepEqual(next.templateAdoptions[result.id],source);
});

test('retry identity survives reload and active groups block duplicate copies across catalog versions',()=>{
  const{state,input}=fixture(),first=addRoutineTemplate(state,input),reloaded=normalizeState(JSON.parse(JSON.stringify(first.state)));
  assert.equal(addRoutineTemplate(reloaded,input).state,reloaded);
  const repeated=addRoutineTemplate(reloaded,{...input,version:2,operationId:'a-new-visit'});assert.equal(repeated.state,reloaded);assert.equal(repeated.id,first.id);
  assert.throws(()=>addRoutineTemplate(reloaded,{...input,sourceId:'different'}),/another template/);
});

test('stopped or expired groups allow a deliberate fresh copy while preserving old answers and completions',()=>{
  const{state,input}=fixture(),first=addRoutineTemplate(state,input),source=first.state.templateAdoptions[first.id];
  let stopped=toggleHabitForDay(first.state,source.records[0].id,input.dateKey);stopped=archiveHabitDefinition(stopped,source.records[0].id);stopped=archiveTask(stopped,source.records[1].id);
  assert.equal(activeRoutineTemplate(stopped,input.sourceId,input.dateKey),undefined);
  const second=addRoutineTemplate(stopped,{...input,operationId:'after-stopping'});assert.equal(Object.keys(second.state.templateAdoptions).length,2);assert.deepEqual(second.state.templateAdoptions[first.id],source);assert.deepEqual(second.state.habits.completions,stopped.habits.completions);
  assert.equal(activeRoutineTemplate(first.state,input.sourceId,'2026-12-05'),undefined);
  const expired=addRoutineTemplate(first.state,{...input,operationId:'after-expiry',dateKey:'2026-12-05'});assert.equal(Object.keys(expired.state.templateAdoptions).length,2);
});

test('missing or invalid answers, oversize output and identifier collisions never add a partial group',()=>{
  const{state,input}=fixture(),before=structuredClone(state);
  for(const edit of [i=>i.answers={},i=>i.answers[Object.keys(i.answers)[0]]='unknown',i=>i.template.items[1].action='x'.repeat(241),i=>i.ongoing='yes',i=>i.dateKey='2026-02-30']) {
    const invalid=structuredClone(input);edit(invalid);assert.throws(()=>addRoutineTemplate(state,invalid));assert.deepEqual(state,before);
  }
  const collision=structuredClone(state);const id='routine-'+input.operationId+'-'+input.template.items[1].id;collision.tasks.items[id]={id,text:'Historical item',status:'archived'};assert.throws(()=>addRoutineTemplate(collision,input),/already uses/);assert.equal(collision.tasks.items[id].text,'Historical item');
});
