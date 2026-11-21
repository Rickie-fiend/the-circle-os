import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyActivity,acceptActivity,changeActivitySource,activityContributions,activityDay,activityGrowthState,activityPulse} from '../app/os/home/imprint-activity-model.js';
import {sampleAction,activitySample,studyNow} from '../app/os/home/imprint-activity-samples.js';
import {contributionPaint,growthWeight,colorFadeAt} from '../app/os/home/imprint-growth-model.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

test('accepted sources share one day and restore their original age', () => {
 let state = emptyActivity();
 const action = sampleAction('note-saved','a','2026-11-16T09:00:00Z','one',{operation:'save-a',day:'2026-11-16'});
 let result = acceptActivity(state, action); state = result.state;
 assert.equal(result.pulse, true);
 assert.equal(acceptActivity(state, action).pulse, false);
 result = acceptActivity(state, {...action, source:'b', operation:'save-b', at:'2026-11-16T10:00:00Z'}); state = result.state;
 assert.equal(result.pulse, true);
 const now = '2026-11-20T12:00:00Z';
 const original = activityContributions(state, 'one', now)[0];
 assert.equal(original.sources.length, 2);
 state = changeActivitySource(state, 'one', 'a', 'trash');
 assert.equal(activityContributions(state, 'one', now)[0].at, original.at);
 state = changeActivitySource(state, 'one', 'b', 'trash');
 assert.equal(activityContributions(state, 'one', now).length, 0);
 state = changeActivitySource(state, 'one', 'a', 'restore');
 assert.equal(activityContributions(state, 'one', now)[0].brightness, original.brightness);
 assert.equal(activityContributions(state, 'other', now).length, 0);
});

test('qualifying map, failures, empty input, edits and unknown origins',()=>{
 const cases=[['chapter-finished','starting'],['note-saved','notes'],['thought-sent','thoughts'],['habit-completed','routine'],['task-completed','routine'],['log-ended','log-week'],['protocol-sealed','protocol']];
 for(const [kind,group]of cases){const action=sampleAction(kind,kind),result=acceptActivity(emptyActivity(),action);assert.equal(result.pulse,true);assert.equal(result.state.sources[0].group,group);for(const extra of [{accepted:false},{changed:false},{draft:true},{correction:true}])assert.equal(acceptActivity(emptyActivity(),{...action,...extra}).pulse,false);}
 for(const extra of [{firstSave:false},{nonempty:false}])assert.equal(acceptActivity(emptyActivity(),sampleAction('note-saved','a',undefined,undefined,extra)).pulse,false);
 assert.equal(acceptActivity(emptyActivity(),sampleAction('thought-sent','a',undefined,undefined,{nonempty:false})).pulse,false);
 assert.equal(acceptActivity(emptyActivity(),sampleAction('task-completed','a',undefined,undefined,{origin:'unknown'})).pulse,false);
 const action=sampleAction('task-completed','a'),state=acceptActivity(emptyActivity(),action).state;
 assert.equal(acceptActivity(state,{...action,operation:'other',origin:'week'}).pulse,false);
 assert.equal(acceptActivity(emptyActivity(),{...action,origin:'week'}).state.sources[0].group,'log-week');
 assert.throws(()=>acceptActivity(state,{...action,at:'2027-01-01T00:00:00Z'}));
});

test('Log qualifies at end only after save; missing times stay unknown',()=>{
 const action=sampleAction('log-ended','log'),now=Date.parse(action.at);
 assert.equal(acceptActivity(emptyActivity(),{...action,endAt:new Date(now+1).toISOString()}).pulse,false);
 assert.equal(acceptActivity(emptyActivity(),{...action,savedAt:new Date(now+1).toISOString()}).pulse,false);
 assert.throws(()=>acceptActivity(emptyActivity(),{...action,endAt:undefined}));
 assert.equal(acceptActivity(emptyActivity(),action).pulse,true);
});

test('Circle day uses local 06:00; accepted attribution survives a boundary and reload',()=>{
 assert.equal(activityDay(new Date(2026,10,17,5,59)),'2026-11-16');
 assert.equal(activityDay(new Date(2026,10,17,6)),'2026-11-17');
 const action=sampleAction('note-saved','crossing',new Date(2026,10,17,6,10).toISOString(),undefined,{day:'2026-11-16'});
 const state=acceptActivity(emptyActivity(),action).state;
 assert.equal(activityContributions(state,action.owner,action.at)[0].day,'2026-11-16');
 assert.equal(acceptActivity(JSON.parse(JSON.stringify(state)),action).pulse,false);
});

test('lifecycle distinguishes archive, clearing, Undo, Trash and terminal deletion',()=>{
 const action=sampleAction('habit-completed','habit'),state=acceptActivity(emptyActivity(),action).state;
 assert.deepEqual(changeActivitySource(state,action.owner,action.source,'archive'),state);
 for(const change of ['trash','clear','undo']){
  const removed=changeActivitySource(state,action.owner,action.source,change);
  assert.equal(activityContributions(removed,action.owner,studyNow()).length,0);
  assert.deepEqual(changeActivitySource(removed,action.owner,action.source,'restore'),state);
 }
 const deleted=changeActivitySource(state,action.owner,action.source,'delete');
 assert.deepEqual(changeActivitySource(deleted,action.owner,action.source,'restore'),deleted);
 assert.equal(acceptActivity(deleted,{...action,operation:'retry-after-delete'}).pulse,false);
 assert.deepEqual(changeActivitySource(state,'other',action.source,'trash'),state);
});

test('five saves count once; owners, groups and days remain separate',()=>{
 let state=emptyActivity();for(let i=0;i<5;i++)state=acceptActivity(state,sampleAction('note-saved',`n${i}`)).state;
 assert.equal(activityContributions(state,'sample-one',studyNow()).length,1);
 for(let i=0;i<4;i++)state=changeActivitySource(state,'sample-one',`n${i}`,'trash');
 assert.equal(activityContributions(state,'sample-one',studyNow()).length,1);
 state=changeActivitySource(state,'sample-one','n4','undo');assert.equal(activityContributions(state,'sample-one',studyNow()).length,0);
 const samples=activitySample();assert.equal(activityContributions(samples,'sample-two',studyNow()).length,1);
 assert.ok(activityContributions(samples,'sample-one',studyNow()).length>30);
});

test('fresh growth has its own clock and does not repaint old growth',()=>{
 const state=activitySample(),now=studyNow(),growth=activityGrowthState(state,'sample-one',now),layers=growth.notes.layers;
 assert.equal(layers.at(-1).brightness,1);assert.equal(layers[0].brightness,.6);
 const anchors={notes:{t:.2,u:.4,scale:1}},only={notes:growth.notes};
 let mixed=false;
 for(let i=0;i<100;i++){
  const t=i/100,u=.4,paint=contributionPaint(anchors,only,t,u),total=growthWeight(anchors.notes,t,u,growth.notes.spread),old=growthWeight(anchors.notes,t,u,layers.at(-2).spread);
  assert.ok(Math.abs(paint.weight-total)<1e-12);
  assert.ok(Math.abs(paint.weight*paint.brightness-(old*.6+total-old))<1e-10);
  const pulse=contributionPaint(anchors,only,t,u,{notes:1});assert.equal(pulse.weight,paint.weight);if(paint.weight)assert.equal(pulse.brightness,1);
  if(paint.brightness>.6&&paint.brightness<1)mixed=true;
 }
 assert.ok(mixed);
 const cutoff=colorFadeAt(layers.at(-1).at),before=activityGrowthState(state,'sample-one',new Date(+cutoff-1)),after=activityGrowthState(state,'sample-one',cutoff);
 assert.equal(before.notes.layers.at(-1).brightness,1);assert.equal(after.notes.layers.at(-1).brightness,.6);
 assert.equal(after.notes.spread,before.notes.spread);
 assert.deepEqual(activityGrowthState(state,'sample-one',new Date(+cutoff+30*86400000)),after);
 assert.deepEqual(contributionPaint(anchors,{},.2,.4),{weight:0,brightness:0});
});

test('pulse is bounded, calm, restartable and ends exactly at 1.5 seconds',()=>{
 assert.equal(activityPulse(0),0);assert.equal(activityPulse(300),1);assert.equal(activityPulse(1500),0);assert.equal(activityPulse(2000),0);
 const level=activityPulse(700);assert.equal(activityPulse(0,level),level);
 for(let t=0;t<1500;t++)assert.ok(activityPulse(t)>=0&&activityPulse(t)<=1);
});

test('a deliberate completion after Undo pulses once without restarting the day clock',()=>{
 const action=sampleAction('habit-completed','habit'),state=acceptActivity(emptyActivity(),action).state;
 const undone=changeActivitySource(state,action.owner,action.source,'undo');
 const again={...action,operation:'retick',at:new Date(Date.parse(action.at)+1000).toISOString()};
 const result=acceptActivity(undone,again);assert.equal(result.pulse,true);
 assert.equal(result.state.sources.length,1);assert.equal(result.state.sources[0].at,action.at);
 assert.equal(acceptActivity(result.state,again).pulse,false);
 assert.throws(()=>acceptActivity(result.state,{...again,at:action.at}));
 assert.equal(acceptActivity(undone,{...again,kind:'task-completed',origin:'week'}).pulse,false);
});

test('full-resolution study retains accepted baseline, valid assets and one-time fade',async()=>{
 const report=JSON.parse(await readFile('docs/design/personal-imprint-activity-v1.json','utf8'));
 const original=JSON.parse(await readFile('docs/design/personal-imprint-generator-v1-inspection.json','utf8')).samples.find(item=>item.id==='sori');
 assert.equal(report.ready,true);assert.equal(report.fullBaselineHash,original.renderHash);
 for(const asset of Object.values(report.outputs)){
  const bytes=await readFile(asset.path),metadata=await sharp(bytes).metadata();
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.hash);assert.equal(metadata.width,390);assert.equal(metadata.height,585);
 }
 assert.equal(report.outputs.faded.hash,report.outputs.quiet.hash);
 assert.notEqual(report.outputs.mixed.hash,report.outputs.faded.hash);
 assert.notEqual(report.outputs.mixed.hash,report.outputs.trash.hash);
});
