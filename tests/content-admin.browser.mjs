import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium, expect } from '@playwright/test';
import { createChapterDraft } from '../app/os/admin/chapter-authoring.js';
import imprintVariants from '../app/os/home/imprint-art-variants.json' with { type: 'json' };
import { readFileSync } from 'node:fs';
import { A, B } from './helpers/writing-cloud.mjs';
import { chapterExchange, chapterSyncDatabase } from './helpers/chapter-sync.mjs';
const chapterPilot = process.env.CIRCLE_TEST_CHAPTER_SYNC === '1';
const useProductionCSS=process.env.CIRCLE_PRODUCTION_CSS==='1';
const productionStylePaths=useProductionCSS?[...new Set([...readFileSync('.next/server/app/os.html','utf8').matchAll(/href="(\/_next\/static\/[^"?]+\.css)(?:\?[^" ]*)?"/g)].map(match=>match[1]))]:[];
if(useProductionCSS)assert.ok(productionStylePaths.length,'build Next before production-CSS checks');
const productionStyles=productionStylePaths.map(path=>readFileSync(`.next${path.slice('/_next'.length)}`,'utf8')).join('\n');
let server,browser,base;
for(const ongoing of [false,true])test(`Routine template Add retains answers, saves one ${ongoing?'ongoing':'21-day'} group and reopens it`,{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
 await context.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(window.failCircleSave&&this.name==='state')throw Error('Synthetic disk failure');return put.apply(this,args);};const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(window.failCircleSave&&key.includes('circle-os-state'))throw Error('Synthetic disk failure');return set.call(this,key,value);};});
 const{createTemplateDraft,createTemplateItem,createTemplatePage,fixedValue}=await import('../app/os/admin/template-model.js');const draft=createTemplateDraft();draft.template.title='Adopted Habit group';draft.template.items[0].action='Read a page';draft.template.items.push({...createTemplateItem('task'),action:'Water a plant',cue:fixedValue('At seven')});const question={...createTemplatePage('short-text'),question:'Why this group?',purpose:'reflection'};draft.template.pages.push(question);
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:2,content:{kind:'routine-template',template:draft.template}}});if(url.pathname==='/os/today')return route.fulfill({contentType:'text/html',body:'<h1>Routine destination</h1>'});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=habit-source&version=2');await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('textbox',{name:question.question,exact:true}).fill('A small daily practice');await page.getByRole('button',{name:'Continue',exact:true}).click();if(ongoing)await page.getByRole('checkbox',{name:'Keep going until I stop'}).check();
 const add=page.getByRole('button',{name:'Add to Routine',exact:true});await expect(add).toBeEnabled();await expect.poll(()=>add.evaluate(el=>Math.round(el.closest('.os-chapter-session').getBoundingClientRect().bottom-el.getBoundingClientRect().bottom))).toBe(25);
 if(!ongoing){await page.evaluate(()=>window.failCircleSave=true);await add.click();await expect(page.getByRole('alert')).toBeVisible();await expect(add).toBeEnabled();await expect(page.getByRole('region',{name:'Template result',exact:true})).toContainText('Read a page');await page.evaluate(()=>window.failCircleSave=false);}
 await add.click();await page.waitForURL('**/os/today#routine');const saved=await page.evaluate(()=>Object.keys(localStorage).map(key=>{try{return JSON.parse(localStorage.getItem(key))?.state;}catch{return null;}}).find(s=>Object.keys(s?.templateAdoptions||{}).length));
 const source=Object.values(saved.templateAdoptions)[0];assert.equal(Object.keys(saved.templateAdoptions).length,1);assert.equal(source.records.length,2);assert.equal(source.version,2);assert.equal(source.answers[0].value,'A small daily practice');assert.equal(source.schedule.mode,ongoing?'ongoing':'daily');assert.equal(source.schedule.days,ongoing?null:21);assert.deepEqual(saved.habits.completions,{});assert.deepEqual(saved.tasks.completions||{},{});
 await page.goto(base+'/fixture?reader=1&id=habit-source&version=2');await expect(page.getByRole('button',{name:'Open Routine',exact:true})).toBeVisible();assert.equal(Object.keys(await page.evaluate(()=>window.readerState.templateAdoptions)).length,1);
 }finally{await context.close();}
});
for(const width of [360,390,416])test(`template cover follows shared type, anchors and Begin cue at ${width}px`,{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 try{
 const {createTemplateDraft}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft();d.template.title='A calm start to your day';d.template.description='Make room for a small daily practice.';d.template.items[0].action='Read';
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'routine-template',template:d.template}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1');
 const title=page.getByRole('heading',{name:d.template.title,exact:true}),body=page.getByText(d.template.description,{exact:true}),cue=page.getByRole('button',{name:'Open Begin',exact:true});
 await expect(title).toHaveCSS('font-size','28px');await expect(title).toHaveCSS('font-weight','700');await expect(body).toHaveCSS('font-size','18px');await expect(body).toHaveCSS('font-weight','400');await expect(cue).toHaveText('Begin›');await expect(cue).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect.poll(()=>title.evaluate(el=>Math.round(el.getBoundingClientRect().top-el.closest('.os-chapter-session').getBoundingClientRect().top))).toBe(25);
 const metrics=await title.evaluate(el=>{const r=el.getBoundingClientRect(),frame=el.closest('.os-chapter-session').getBoundingClientRect(),copy=el.parentElement;return {left:r.left-frame.left,gap:copy.querySelector('p').getBoundingClientRect().top-r.bottom,max:getComputedStyle(el).maxWidth};});assert.equal(metrics.left,25);assert.equal(metrics.gap,24);assert.equal(metrics.max,'none');assert.ok((await cue.boundingBox()).height>=44);
 await page.locator('.os-chapter-session').screenshot({path:`outputs/template-cover-${width}.png`});
 if(width===360)await page.locator('.os-chapter-session').press('ArrowRight');
 else if(width===416){const box=await page.locator('.os-chapter-session').boundingBox();await page.mouse.move(box.x+box.width*.8,box.y+180);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+180,{steps:8});await page.mouse.up();}
 else await cue.click();
 await expect(page.getByRole('region',{name:'Template result',exact:true})).toContainText('Read');
 }finally{await context.close();}
});
test('temporary Admin media errors preserve the mounted editor and recovery survives access retry',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});let status=503;
 try{await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});if(url.pathname==='/os/admin/catalog')return route.fulfill({json:[]});if(url.pathname==='/os/admin/media')return route.fulfill({status,json:{error:'Synthetic failure'}});return route.continue();});const page=await context.newPage();await page.goto(base+'/fixture');await page.getByRole('button',{name:'Habit templates',exact:true}).click();await page.getByLabel('Explore name',{exact:true}).fill('Retained local template');await page.getByRole('button',{name:'Choose image',exact:true}).click();await expect(page.getByLabel('Explore name',{exact:true})).toHaveValue('Retained local template');status=403;await page.getByRole('button',{name:'Choose image',exact:true}).click();await expect(page.getByText('Admin access is not available for this account.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByLabel('Explore name',{exact:true})).toHaveValue('Retained local template');
 }finally{await context.close();}
});
test('Admin menu prechecks before opening and reuses access on repeated opens',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});let checks=0;
 try{await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/admin/status'){checks++;return route.fulfill({json:{admin:true}});}return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?menu=1');await expect.poll(()=>checks).toBe(1);await page.getByRole('button',{name:'Open account',exact:true}).click();await expect(page.getByRole('button',{name:'Admin',exact:true})).toBeVisible();await page.getByRole('button',{name:'Open account',exact:true}).click();await page.getByRole('button',{name:'Open account',exact:true}).click();await expect(page.getByRole('button',{name:'Admin',exact:true})).toBeVisible();assert.equal(checks,1);
 }finally{await context.close();}
});
test('template effort removal clears saved evening links through save and reload',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
 const {createTemplateDraft,createTemplatePage,fixedValue}=await import('../app/os/admin/template-model.js');
 const draft=createTemplateDraft();draft.template.title='Effort fixture';draft.template.items[0].action='Read';draft.template.items[0].actionPattern='Read {intensity}';draft.template.items[0].cue=fixedValue('After dinner');
 const question={...createTemplatePage('single-choice'),question:'Choose a time of day',options:[{id:'morning',label:'morning'},{id:'evening',label:'evening'}]};draft.template.pages.push(question);
 draft.template.items[0].intensity={...fixedValue(),source:'answer',answerKey:question.answerKey};let saved=draft;
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});if(url.pathname==='/os/admin/catalog'){if(route.request().method()==='POST'){saved=route.request().postDataJSON().draft;return route.fulfill({json:{revision:1}});}return route.fulfill({json:[{id:saved.draftId,draft:saved,revision:1}]});}return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture');await page.getByRole('button',{name:'Habit templates',exact:true}).click();
 const preview=async()=>{await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('button',{name:'evening',exact:true}).click();};
 await preview();const result=page.getByRole('region',{name:'Template result',exact:true});await expect(result.getByText('Read evening',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Remove effort',exact:true}).click();await expect(page.getByRole('group',{name:'Effort (optional)',exact:true})).toHaveCount(0);
 await preview();await expect(result.getByText('Read',{exact:true})).toBeVisible();await expect(result).not.toContainText('evening');await expect(result).toContainText('After dinner');
 await page.getByRole('button',{name:'Save template draft',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved online'})).toBeVisible();assert.deepEqual(saved.template.items[0].intensity,fixedValue());
 await page.reload();await page.getByRole('button',{name:'Habit templates',exact:true}).click();await expect(page.getByRole('button',{name:'Add effort',exact:true})).toBeVisible();await preview();await expect(result).not.toContainText('evening');
 await page.getByRole('button',{name:'Add effort',exact:true}).click();await expect(page.getByRole('group',{name:'Effort (optional)',exact:true}).getByRole('textbox')).toHaveValue('');await expect(result).not.toContainText('evening');const effort=page.getByRole('group',{name:'Effort (optional)',exact:true}).getByRole('textbox');await effort.fill('gentle');await preview();await expect(result.getByText('Read gentle',{exact:true})).toBeVisible();await effort.fill('');await preview();await expect(result.getByText('Read',{exact:true})).toBeVisible();await expect(result).not.toContainText('evening');
 }finally{await context.close();}
});

test('template written answers use a fading Bone line and grow with long writing',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
 const {createTemplateDraft,createTemplatePage}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft();d.template.title='Writing fixture';d.template.items[0].action='Read';d.template.pages.push({...createTemplatePage('long-text'),question:'What helps you begin?'});
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'routine-template',template:d.template}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1');await page.getByRole('button',{name:'Open Begin',exact:true}).click();
 const input=page.getByRole('textbox',{name:'What helps you begin?',exact:true});await expect(input).toHaveCSS('border-bottom-width','0px');
 await expect.poll(()=>input.evaluate(el=>Math.round(el.getBoundingClientRect().left-el.closest('.os-chapter-session').getBoundingClientRect().left))).toBe(25);
 const metrics=await input.evaluate(el=>{const style=getComputedStyle(el.closest('.os-survey-text'),'::after'),r=el.getBoundingClientRect(),frame=el.closest('.os-chapter-session').getBoundingClientRect();return {background:style.backgroundImage,left:r.left-frame.left,right:frame.right-r.right,height:r.height};});
 assert.match(metrics.background,/linear-gradient/);assert.match(metrics.background,/241, 239, 232/);assert.ok(Math.abs(metrics.left-25)<=1,JSON.stringify(metrics));assert.ok(Math.abs(metrics.right-25)<=1,JSON.stringify(metrics));
 await input.fill(Array(30).fill('A quiet start helps me read.').join('\n'));assert.ok((await input.boundingBox()).height>metrics.height);await page.locator('.os-chapter-session').screenshot({path:'outputs/template-answer-line.png'});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('region',{name:'Template result',exact:true})).toContainText('Read');assert.deepEqual(await page.evaluate(()=>window.readerState.chapters.runs),{});
 }finally{await context.close();}
});

test('template time picker keeps placeholder empty until an explicit choice',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{const {createTemplateDraft,createTemplatePage,fixedValue}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft();d.template.title='Time fixture';d.template.items[0].action='Read';const question={...createTemplatePage('time'),question:'Choose a time'};d.template.pages.push(question);d.template.items[0].cue={...fixedValue(),source:'answer',answerKey:question.answerKey};await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'routine-template',template:d.template}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1');await page.getByRole('button',{name:'Open Begin',exact:true}).click();const next=page.getByRole('button',{name:'Continue',exact:true});await expect(next).toBeDisabled();
 const hour=page.getByRole('listbox',{name:'Hour',exact:true}),minute=page.getByRole('listbox',{name:'Minute',exact:true}),period=page.getByRole('listbox',{name:'AM/PM',exact:true});
 for(const wheel of [hour,minute,period]){await expect(wheel).toBeVisible();await expect(wheel.getByRole('option',{selected:true})).toHaveCount(0);}
 await expect(hour.locator('.is-centred')).toHaveText('6');await expect(minute.locator('.is-centred')).toHaveText('00');await expect(period.locator('.is-centred')).toHaveText('AM');await expect(period.getByRole('option')).toHaveCount(2);
 const initial=await minute.evaluate(el=>[...el.children].filter(child=>{const a=child.getBoundingClientRect(),b=el.getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom;}).map(child=>child.textContent));assert.deepEqual(initial,['59','00','01']);
 await minute.locator('.is-centred').click();await expect(next).toBeEnabled();await expect(hour.getByRole('option',{selected:true})).toHaveText('6');await expect(period.getByRole('option',{selected:true})).toHaveText('AM');
 await page.reload();await page.getByRole('button',{name:'Open Begin',exact:true}).click();await expect(next).toBeDisabled();
 await hour.focus();await hour.press('ArrowDown');await expect(hour.getByRole('option',{selected:true})).toHaveText('7');await expect(minute.getByRole('option',{selected:true})).toHaveText('00');await expect(period.getByRole('option',{selected:true})).toHaveText('AM');
 await minute.hover();await page.mouse.wheel(0,44);await expect(minute.getByRole('option',{selected:true})).toHaveText('01');await expect(hour.getByRole('option',{selected:true})).toHaveText('7');
 await period.focus();await period.press('ArrowDown');await expect(period.getByRole('option',{selected:true})).toHaveText('PM');await period.press('ArrowDown');await expect(period.getByRole('option',{selected:true})).toHaveText('PM');await expect(hour.getByRole('option',{selected:true})).toHaveText('7');
 await page.locator('.os-chapter-session').screenshot({path:'outputs/template-time-picker.png'});await next.click();await expect(page.getByRole('region',{name:'Template result',exact:true})).toContainText('7:01 PM');assert.deepEqual(await page.evaluate(()=>window.readerState.chapters.runs),{});
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(hour.getByRole('option',{selected:true})).toHaveText('7');await expect(minute.getByRole('option',{selected:true})).toHaveText('01');
 await minute.focus();await minute.press('ArrowUp');await minute.press('ArrowUp');await expect(minute.getByRole('option',{selected:true})).toHaveText('59');await expect(hour.getByRole('option',{selected:true})).toHaveText('7');
 await minute.press('ArrowDown');await expect(minute.getByRole('option',{selected:true})).toHaveText('00');
 await hour.focus();for(let i=0;i<5;i++)await hour.press('ArrowDown');await expect(hour.getByRole('option',{selected:true})).toHaveText('12');await period.focus();await period.press('ArrowUp');
 await next.click();await expect(page.getByRole('region',{name:'Template result',exact:true})).toContainText('12:00 AM');
 }finally{await context.close();}
});

test('Admin templates build a personalized group, reorder Pages, recover and preview without adoption',{timeout:120000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}}),rows=[],errors=[],published=[],catalog=[];
 let targetedImages=0;
 try{
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
   if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});
   if(url.pathname==='/os/admin/media'){if(url.searchParams.has('id'))targetedImages++;return route.fulfill({json:[{id:'11111111-2222-4333-8444-555555555555',alt:'Synthetic practice image',preview:base+'/template-image.svg'}]});}
   if(url.pathname==='/template-image.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="orange"/></svg>'});
   if(url.pathname==='/os/catalog')return route.fulfill({json:catalog});
   if(url.pathname==='/os/admin/publications'){const command=route.request().postDataJSON();published.push(command);catalog.push({id:command.id,kind:'routine-template',title:command.draft.template.title,version:1,revision:1,withdrawn:false});return route.fulfill({json:{version:1,revision:1}});}
   if(url.pathname==='/os/admin/catalog'){
    if(route.request().method()==='POST'){const body=route.request().postDataJSON();const index=rows.findIndex(r=>r.id===body.draft.draftId);if(index>=0)rows.splice(index,1);rows.unshift({id:body.draft.draftId,draft:body.draft,revision:1});return route.fulfill({json:{revision:1}});}
    return route.fulfill({json:rows});
   }return route.continue();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/fixture');
  await page.getByRole('button',{name:'Habit templates',exact:true}).click();
  await page.getByLabel('Explore name',{exact:true}).fill('Synthetic group');
  await page.getByLabel('Action',{exact:true}).fill('Practice push-ups');
  await page.getByLabel('Target unit',{exact:true}).fill('repetitions');
  await page.getByLabel('New Page type',{exact:true}).selectOption('number');await page.getByRole('button',{name:'Add Page',exact:true}).click();
  const panel=page.getByRole('region',{name:'Template Page 1',exact:true});
  await panel.getByLabel('Question',{exact:true}).fill('Choose your repetitions');await panel.getByLabel('Maximum',{exact:true}).fill('50');
  await panel.getByRole('button',{name:'Duplicate Page',exact:true}).click();await page.getByRole('region',{name:'Template Page 2',exact:true}).getByRole('button',{name:'Move Page earlier',exact:true}).click();await page.getByRole('region',{name:'Template Page 1',exact:true}).getByRole('button',{name:'Remove Page',exact:true}).click();
  const target=page.getByRole('group',{name:'target',exact:true});await target.getByLabel('Value source').selectOption('answer');await target.getByLabel('Question to use').selectOption({label:'Choose your repetitions'});
  await page.getByRole('button',{name:'Duplicate item',exact:true}).click();
  await page.getByRole('region',{name:'Template item 2',exact:true}).getByLabel('Action',{exact:true}).fill('Second authored item');
  await page.getByLabel('New Page type',{exact:true}).selectOption('info');await page.getByRole('button',{name:'Add Page',exact:true}).click();
  const intro=page.getByRole('region',{name:'Template Page 2',exact:true});await intro.getByLabel('Page title',{exact:true}).fill('About this practice');await intro.getByLabel('Page text',{exact:true}).fill('An authored introduction.');
  await intro.getByRole('button',{name:'Choose image',exact:true}).click();await intro.getByLabel('Image',{exact:true}).selectOption('11111111-2222-4333-8444-555555555555');
  await intro.locator('select').filter({has:page.locator('option[value="before-text"]')}).selectOption('before-text');await intro.getByRole('button',{name:'Move Page earlier',exact:true}).click();
  await page.getByRole('button',{name:'Save template draft',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved online'})).toBeVisible();
  assert.equal(rows[0].draft.template.items.length,2);
  assert.equal(targetedImages,1,'editor and player share one targeted image request despite draft edits');
  await page.getByLabel('Explore name',{exact:true}).fill('Recovered synthetic group');
  await page.reload();await page.getByRole('button',{name:'Habit templates',exact:true}).click();await expect(page.getByLabel('Explore name',{exact:true})).toHaveValue('Recovered synthetic group');
  assert.equal(rows[0].draft.template.title,'Synthetic group');
  await page.getByRole('button',{name:'Save template draft',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved online'})).toBeVisible();
  await page.getByRole('button',{name:'Open Begin',exact:true}).click();
  await expect(page.getByRole('heading',{name:'About this practice',exact:true})).toBeVisible();
  const positions=await page.locator('.os-chapter-session').evaluate(frame=>{const image=frame.querySelector('img'),title=[...frame.querySelectorAll('h2')].find(node=>node.textContent==='About this practice');return {image:image.getBoundingClientRect().top,title:title.getBoundingClientRect().top};});assert.ok(positions.image<positions.title,JSON.stringify(positions));
  await page.locator('.os-chapter-session').press('ArrowRight');
  await expect(page.getByRole('spinbutton',{name:'Choose your repetitions',exact:true})).toHaveCSS('font-size','18px');await expect(page.getByRole('spinbutton',{name:'Choose your repetitions',exact:true})).toHaveCSS('font-weight','400');
  await page.locator('.os-chapter-session').screenshot({path:'outputs/template-number-page.png'});
  await page.getByRole('spinbutton',{name:'Choose your repetitions',exact:true}).fill('6');await page.getByRole('button',{name:'Continue',exact:true}).click();
  const result=page.getByRole('region',{name:'Template result',exact:true});await expect(result.getByText('6 repetitions',{exact:true})).toHaveCount(2);
  await expect(page.getByRole('button',{name:'Add to Routine',exact:true})).toBeDisabled();
  await expect(page.getByText('Preview only. Nothing is added to Routine or Protocol.',{exact:true})).toHaveCount(0);
  await expect(result.getByText('Every day for 21 days',{exact:true})).toHaveCount(0);await result.getByRole('checkbox').check();await expect(result.getByText('Every day until stopped',{exact:true})).toHaveCount(0);
  await expect(result.locator('.os-record-text').first()).toHaveCSS('opacity','1');
  const face=await result.getByRole('checkbox').evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};});assert.deepEqual(face,{width:28,height:28});
  await page.locator('.os-chapter-session').screenshot({path:'outputs/template-result.png'});
  assert.equal(rows[0].draft.template.items[0].target.source,'answer');assert.deepEqual(errors,[]);
  page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Catalog publishing',exact:true}).click();await page.getByRole('button',{name:'Open catalog',exact:true}).click();await page.getByRole('button',{name:'Publish version 1',exact:true}).click();await expect(page.getByRole('link',{name:'Read v1',exact:true})).toBeVisible();assert.equal(published[0].id,rows[0].id);assert.equal(published[0].draft.template.title,'Recovered synthetic group');
 }finally{await context.close();}
});

test('template Start cannot reuse a catalog response after the account scope changes',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});let revoked=false;
 try{const{createTemplateDraft}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft('protocol');d.template.title='Scoped Protocol';d.template.items[0].action='Read';
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({status:revoked?403:200,json:revoked?{error:'Denied'}:{version:1,content:{kind:'protocol-template',template:d.template}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=scoped&version=1');await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(page.getByRole('button',{name:'Start',exact:true})).toBeVisible();revoked=true;await page.evaluate(()=>window.adminSwitch('synthetic-other'));await expect(page.getByRole('button',{name:'Start',exact:true})).toHaveCount(0);await expect(page.getByText('Scoped Protocol',{exact:true})).toHaveCount(0);
 }finally{await context.close();}
});

test('Admin Protocol preview shows a disabled Start without creating a phase',{timeout:60000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});if(url.pathname==='/os/admin/catalog')return route.fulfill({json:[]});return route.continue();});const page=await context.newPage();await page.goto(base+'/fixture');await page.getByRole('button',{name:'Protocol templates',exact:true}).click();await page.getByLabel('Explore name',{exact:true}).fill('Admin preview');await page.getByLabel('Action',{exact:true}).fill('Read');await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(page.getByRole('button',{name:'Start',exact:true})).toBeDisabled();}finally{await context.close();}
});

test('Protocol template Start saves once, retains answers on failure, retries and opens the destination',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
 await context.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(window.failCircleSave&&this.name==='state')throw Error('Synthetic disk failure');return put.apply(this,args);};const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(window.failCircleSave&&key.includes('circle-os-state'))throw Error('Synthetic disk failure');return set.call(this,key,value);};});
 const {createTemplateDraft,createTemplatePage}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft('protocol');d.template.title='Started template';d.template.items[0].action='Read a page';const question=createTemplatePage('short-text');question.question='Why this phase?';question.purpose='reflection';d.template.pages.push(question);
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:2,content:{kind:'protocol-template',template:d.template}}});if(url.pathname==='/os/today')return route.fulfill({contentType:'text/html',body:'<h1>Protocol destination</h1>'});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=source-template&version=2');await page.waitForFunction(()=>window.readerState);
 await expect(page.getByRole('button',{name:'Open Begin',exact:true})).toBeVisible();
 await page.evaluate(async()=>{const {publishedChapters}=await import('/app/os/chapters/registry.ts');const {createChapterRun,chapterRunId}=await import('/app/os/chapters/chapter-model.js');const chapter=publishedChapters.find(c=>c.id==='day-one');const run={...createChapterRun(chapter),status:'completed',completedAt:new Date().toISOString(),currentPageId:chapter.pages.at(-1).id,furthestPageId:chapter.pages.at(-1).id};window.readerUpdate(s=>({...s,chapters:{...s.chapters,runs:{[chapterRunId(chapter)]:run}}}));});
 await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('textbox',{name:'Why this phase?',exact:true}).fill('To read slowly');await page.getByRole('button',{name:'Continue',exact:true}).click();
 const preview=page.getByRole('button',{name:'Preview',exact:true});await expect.poll(()=>preview.evaluate(el=>Math.round(el.closest('.os-chapter-session').getBoundingClientRect().bottom-el.getBoundingClientRect().bottom))).toBe(25);
 await preview.click();await expect(page.getByRole('button',{name:'Start',exact:true})).toBeEnabled();await page.evaluate(()=>window.failCircleSave=true);
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('button',{name:'Start',exact:true})).toHaveAttribute('aria-busy','false');await expect(page.getByRole('button',{name:'Start',exact:true})).toBeEnabled();assert.ok(page.url().includes('/fixture'));
 await page.evaluate(()=>window.failCircleSave=false);await page.getByRole('button',{name:'Start',exact:true}).click();await page.waitForURL('**/os/today#protocol');
 const persisted=await page.evaluate(()=>Object.keys(localStorage).map(key=>{try{return JSON.parse(localStorage.getItem(key))?.state;}catch{return null;}}).find(s=>s?.protocol&&Object.keys(s.protocol.runs).length));
 const runs=Object.values(persisted.protocol.runs);assert.equal(runs.length,1);assert.equal(runs[0].status,'active');assert.equal(runs[0].sourceTemplate.id,'source-template');assert.equal(runs[0].sourceTemplate.version,2);assert.equal(runs[0].sourceTemplate.answers[0].value,'To read slowly');assert.deepEqual(persisted.protocol.completions,{});assert.equal(persisted.appSessions['today-habit'].index,1);
 await page.goto(base+'/fixture?reader=1&id=source-template&version=2');await page.waitForFunction(()=>Object.keys(window.readerState?.protocol.runs||{}).length===1);
 await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('textbox',{name:'Why this phase?',exact:true}).fill('Still reading');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(page.getByRole('button',{name:'Open Protocol',exact:true})).toBeVisible();assert.equal(await page.evaluate(()=>Object.keys(window.readerState.protocol.runs).length),1);
 }finally{await context.close();}
});

test('signed-in template reader previews a fixed Protocol without saving personal evidence',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 try{
  const {createTemplateDraft,createTemplatePage}=await import('../app/os/admin/template-model.js');const d=createTemplateDraft('protocol');d.template.title='Synthetic fixed Protocol';d.template.items[0].action='A fixed term';
  d.template.pages.push({...createTemplatePage('short-text'),question:'Optional reflection number',inputFormat:'number',min:0,max:10,required:false,purpose:'reflection'});
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'protocol-template',template:d.template}}});return route.continue();});
  const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=template&version=1');await page.getByRole('button',{name:'Open Begin',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Optional reflection number',exact:true})).toHaveValue('');await page.getByRole('button',{name:'Continue',exact:true}).click();
  const result=page.getByRole('region',{name:'Template result',exact:true});await expect(result.getByText('A fixed term',{exact:true})).toBeVisible();
  for(const width of [360,390,416]){await page.setViewportSize({width,height:900});
   for(const days of [1,3,7,14,21]){
    await result.getByRole('group',{name:'How many days',exact:true}).getByRole('button',{name:days+' days',exact:true}).click();
    const preview=result.getByRole('button',{name:'Preview',exact:true});await expect.poll(()=>preview.evaluate(el=>Math.round(el.closest('.os-chapter-session').getBoundingClientRect().bottom-el.getBoundingClientRect().bottom))).toBe(25);await preview.click();
    await expect(result.getByText('Day 1 of '+days,{exact:true})).toBeVisible();await expect(result.getByText('Synthetic fixed Protocol',{exact:true})).toHaveCSS('font-size','28px');
    await expect(result.getByText('Non-negotiable',{exact:true})).toHaveCSS('font-size','18px');await expect(result.getByText('Non-negotiable',{exact:true})).toHaveCSS('font-weight','700');await expect(result.getByText('Synthetic fixed Protocol',{exact:true})).toHaveCSS('font-weight','700');await expect(result.getByRole('button',{name:'Keep: A fixed term',exact:true})).toBeDisabled();
    await expect.poll(()=>result.locator('.os-app-page-heading').evaluate(el=>Math.round(el.getBoundingClientRect().top-el.closest('.os-page-layout').querySelector('.os-page-header').getBoundingClientRect().bottom))).toBe(24);
    await expect(result.getByRole('button',{name:'Edit',exact:true})).toHaveCount(0);await expect(result.getByRole('button',{name:'Phases',exact:true})).toHaveCount(0);
    if(days===21){await expect.poll(()=>page.locator('.os-chapter-session').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(700);await page.locator('.os-chapter-session').screenshot({path:'outputs/protocol-template-'+width+'.png'});}
    await result.getByRole('button',{name:'Back',exact:true}).click();
    await expect(result.getByRole('group',{name:'How many days',exact:true}).getByRole('button',{name:days+' days',exact:true})).toHaveAttribute('aria-pressed','true');
   }
  }
  assert.deepEqual(await page.evaluate(()=>window.readerState.chapters.runs),{});assert.deepEqual(await page.evaluate(()=>window.readerState.protocol.runs),{});
  await page.reload();await expect(page.getByRole('heading',{name:'Synthetic fixed Protocol',exact:true})).toBeVisible();
 }finally{await context.close();}
});

test('existing catalog run reloads with its original definition',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}}),chapter=createChapterDraft().chapter;chapter.id='saved-catalog-run';chapter.pages[0].title='Saved original cover';
 try{await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'chapter',chapter}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=saved-catalog-run&version=1');await expect(page.getByRole('heading',{name:'Saved original cover'})).toBeVisible();
 await page.evaluate(async definition=>{const {createChapterRun,chapterRunId}=await import('/app/os/chapters/chapter-model.js');const run=createChapterRun(definition);run.currentPageId='opening';run.furthestPageId='opening';window.readerUpdate(current=>({...current,chapters:{...current.chapters,runs:{[chapterRunId(definition)]:run}}}));},chapter);
 await expect.poll(()=>page.evaluate(()=>window.readerDefinitions[0]?.id)).toBe('saved-catalog-run');
 await page.reload();await expect.poll(()=>page.evaluate(()=>Object.values(window.readerState?.chapters.runs||{})[0]?.currentPageId)).toBe('opening');await expect.poll(()=>page.evaluate(()=>window.readerDefinitions[0]?.version)).toBe(1);
 }finally{await context.close();}
});

test('new Chapter exact-version reading previews without creating personal evidence',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});const chapter=createChapterDraft().chapter;chapter.id='catalog-preview';chapter.title='Original chapter';chapter.pages[0].title='Original cover';
 try{await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/os/catalog')return route.fulfill({json:{version:1,content:{kind:'chapter',chapter}}});return route.continue();});
 const page=await context.newPage();await page.goto(base+'/fixture?reader=1&id=catalog-preview&version=1&preview=1');await expect(page.getByRole('heading',{name:'Original cover',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Swipe to begin'}).click();
 assert.deepEqual(await page.evaluate(()=>window.readerState.chapters.runs),{});await page.reload();await expect(page.getByText('Original cover',{exact:true})).toBeVisible();assert.deepEqual(await page.evaluate(()=>window.readerState.chapters.runs),{});
 }finally{await context.close();}
});

test('published Chapter starts from empty, resumes its submitted answer and finishes on a left swipe', { timeout: 90000 }, async () => {
 const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
 const chapter = createChapterDraft().chapter;
 chapter.id = 'new-catalog-run';
 chapter.pages[0].title = 'Original cover';
 chapter.pages[1] = { type: 'short-text', id: 'question', question: 'What did you notice?', answerKey: 'noticed', required: true };
 const requests = [];
 try {
  await context.route('**/*', async route => {
   const url = new URL(route.request().url());
   if (url.origin !== base) return route.abort();
   if (url.pathname === '/os/explore') return route.fulfill({ contentType: 'text/html', body: '<main>Explore destination</main>' });
   const art = imprintVariants.flatMap(({ bone, coordinates }) => [bone, coordinates]).find(asset => '/' + asset.path === url.pathname);
   if (art) return route.fulfill({ path: 'docs/design/' + art.file, contentType: art.type });
   if (url.pathname !== '/os/catalog') return route.continue();
   const version = Number(url.searchParams.get('version'));
   requests.push(version);
   const edition = version === 2 ? { ...chapter, version, pages: [{ ...chapter.pages[0], title: 'Newer cover' }, ...chapter.pages.slice(1)] } : chapter;
   return route.fulfill({ json: { version, content: { kind: 'chapter', chapter: edition } } });
  });
  const page = await context.newPage();
  const readerUrl = base + '/fixture?reader=1&id=new-catalog-run';
  await page.goto(readerUrl + '&version=1');
  await expect(page.getByRole('heading', { name: 'Original cover' })).toBeVisible();
  assert.deepEqual(await page.evaluate(() => window.readerState.chapters.runs), {});
  await page.getByRole('button', { name: 'Swipe to begin' }).click();
  const answer = page.getByRole('textbox', { name: 'What did you notice?' });
  await answer.fill('An answer saved from the reader.');
  await page.evaluate(() => {
   const set = Storage.prototype.setItem;
   const put = IDBObjectStore.prototype.put;
   Storage.prototype.setItem = function (key, value) {
    if (key.startsWith('circle-os-state')) throw new DOMException('Synthetic full device', 'QuotaExceededError');
    return set.call(this, key, value);
   };
   IDBObjectStore.prototype.put = function (value, key) {
    if (this.name === 'state') throw new DOMException('Synthetic full device', 'QuotaExceededError');
    return put.call(this, value, key);
   };
   window.restoreChapterStorage = () => { Storage.prototype.setItem = set; IDBObjectStore.prototype.put = put; };
  });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save Chapter progress');
  await expect(answer).toHaveValue('An answer saved from the reader.');
  await page.evaluate(() => window.restoreChapterStorage());
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('Swipe when ready')).toBeVisible();
  await page.goto(readerUrl + '&version=2&resume=1');
  await expect(page.getByText('Swipe when ready')).toBeVisible();
  assert.equal(requests.at(-1), 1);
  await page.reload();
  await expect(page.getByText('Swipe when ready')).toBeVisible();
  const box = await page.getByLabel('Published chapter reading').boundingBox();
  assert.ok(box);
  const y = box.y + Math.min(150, box.height / 2);
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 14 });
  await page.mouse.up();
  await expect(page.getByText('Explore destination')).toBeVisible();
  await page.goto(readerUrl + '&version=1');
  await expect(page.getByText('Chapter complete.')).toBeVisible();
  const saved = await page.evaluate(() => Object.values(window.readerState.chapters.runs));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].chapterVersion, 1);
  assert.equal(saved[0].answers[0].value, 'An answer saved from the reader.');
  assert.equal(saved[0].status, 'completed');
  assert.ok(saved[0].imprintFinish);
  await page.goto(base + '/fixture?home=1');
  const canvas = page.getByRole('img', { name: 'Activity colors on the accepted shape' });
  const visibleColor = async () => {
   await expect(canvas).toHaveAttribute('data-ready', 'true');
   return canvas.evaluate(el => {
    const pixels = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > pixels[i + 1] + 20) count++;
    return count;
   });
  };
  const color = await visibleColor();
  assert.ok(color > 0);
  await page.reload();
  assert.equal(await visibleColor(), color);
  await page.goto(readerUrl + '&version=2');
  await expect(page.getByRole('heading', { name: 'Newer cover' })).toBeVisible();
 } finally {
  await context.close();
 }
});

test('Chapter sync pilot resumes across profiles and retains an offline conflict after a lost finish reply', { timeout: 120000, skip: !chapterPilot }, async () => {
 const chapter = createChapterDraft().chapter;
 chapter.id = 'sync-chapter';
 chapter.pages[0].title = 'Original cover';
 chapter.pages[1] = { type: 'short-text', id: 'question', question: 'What did you notice?', answerKey: 'noticed', required: true };
 const newer = { ...chapter, version: 2, pages: [{ ...chapter.pages[0], title: 'Newer cover' }, ...chapter.pages.slice(1)] };
 const db = await chapterSyncDatabase([chapter, newer]);
 const contexts = [];
 let finishAttempt;
 let finishRetries = 0;
 const reader = version => base + '/fixture?reader=1&id=sync-chapter&version=' + version + '&resume=1';
 async function profile(account) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  contexts.push(context);
  await context.addInitScript(id => { window.fixtureAccount = id; }, account);
  await context.route('**/*', async route => {
   const request = route.request();
   const url = new URL(request.url());
   if (url.origin !== base) return route.abort();
   if (url.pathname === '/os/explore') return route.fulfill({ contentType: 'text/html', body: '<main>Explore destination</main>' });
   const art = imprintVariants.flatMap(({ bone, coordinates }) => [bone, coordinates]).find(asset => '/' + asset.path === url.pathname);
   if (art) return route.fulfill({ path: 'docs/design/' + art.file, contentType: art.type });
   if (url.pathname === '/os/catalog') {
    const edition = url.searchParams.get('version') === '2' ? newer : chapter;
    return route.fulfill({ json: { version: edition.version, content: { kind: 'chapter', chapter: edition } } });
   }
   if (url.pathname !== '/os/catalog/chapter-sync') return route.continue();
   assert.equal(request.headers().authorization, 'Bearer ' + account);
   const { owner, operation } = request.postDataJSON();
   const result = await chapterExchange(db, account, owner, operation);
   if (operation?.run.status === 'completed' && account === A) {
    finishRetries++;
    if (!finishAttempt) {
     finishAttempt = operation;
     return route.abort();
    }
    assert.deepEqual(operation, finishAttempt);
   }
   return route.fulfill({ json: result });
  });
  return context;
 }
 try {
  const one = await profile(A);
  let first = await one.newPage();
  await first.goto(reader(1));
  await first.getByRole('button', { name: 'Swipe to begin' }).click();
  await expect.poll(async () => (await chapterExchange(db, A))[0]?.revision).toBe(1);

  const two = await profile(A);
  const second = await two.newPage();
  await second.goto(reader(2));
  const answer = page => page.getByRole('textbox', { name: 'What did you notice?' });
  await expect(answer(second)).toHaveValue('');
  await two.setOffline(true);
  await answer(second).fill('Competing answer');
  await second.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(second.getByText('Swipe when ready')).toBeVisible();

  await one.setOffline(true);
  await answer(first).fill('Original answer');
  await first.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(first.getByText('Swipe when ready')).toBeVisible();
  await first.close();
  await one.setOffline(false);
  first = await one.newPage();
  await first.goto(reader(2));
  await expect(first.getByText('Swipe when ready')).toBeVisible();
  await expect.poll(async () => (await chapterExchange(db, A))[0]?.run.answers[0]?.value).toBe('Original answer');
  await first.evaluate(() => {
   document.addEventListener('click', event => {
    if (event.target.closest('a[href="/os/explore"]')) {
     event.preventDefault();
     window.finishedToExplore = true;
    }
   }, { capture: true });
  });
  const box = await first.getByLabel('Published chapter reading').boundingBox();
  assert.ok(box);
  const y = box.y + Math.min(150, box.height / 2);
  await first.mouse.move(box.x + box.width * .8, y);
  await first.mouse.down();
  await first.mouse.move(box.x + box.width * .2, y, { steps: 14 });
  await first.mouse.up();
  await first.waitForFunction(() => window.finishedToExplore);
  const pulses = page => page.evaluate(() => window.readerPulses(new Set(['chapter:sync-chapter@1'])));
  await expect.poll(() => pulses(first)).toEqual([expect.objectContaining({ group: 'starting', sources: ['chapter:sync-chapter@1'] })]);
  assert.deepEqual(await pulses(first), []);
  await first.goto(reader(1));
  await expect(first.getByText('Chapter complete.')).toBeVisible();
  await expect.poll(() => finishRetries, { timeout: 12000 }).toBe(2);
  const [settled] = await chapterExchange(db, A);
  assert.equal(settled.revision, 3);
  assert.equal(settled.run.status, 'completed');

  await two.setOffline(false);
  await expect(second.getByText('This Chapter changed on another device. Both copies are saved.')).toBeVisible();
  await expect(second.getByText('Chapter complete.')).toBeVisible();
  assert.deepEqual(await pulses(second), []);
  // Reopen the exact finished edition. Explore's version 2 entry is available
  // as a new run once version 1 is no longer in progress.
  await second.goto(reader(1));
  await second.reload();
  await expect(second.getByText('Chapter complete.')).toBeVisible();
  const copies = await second.evaluate(async account => {
   const { getAccountScope } = await import('/app/os/account-scope.js');
   const { readChapterSync } = await import('/app/os/chapters/chapter-sync-store.ts');
   const scope = getAccountScope();
   if (scope.accountId !== account) throw Error('Unexpected account');
   return (await readChapterSync(scope))['sync-chapter@1'];
  }, A);
  assert.equal(copies.competing.answers[0].value, 'Competing answer');
  assert.deepEqual(copies.run, settled.run);

  await second.getByRole('link', { name: 'Review answers', exact: true }).click();
  await expect(second.getByRole('region', { name: 'Synced answers' })).toContainText('Original answer');
  await expect(second.getByRole('region', { name: 'On this device' })).toContainText('Competing answer');
  await expect(second.getByRole('button', { name: /Use .*answers/ })).toHaveCount(0);
  assert.deepEqual(await chapterExchange(db, A), [settled]);

  await second.goto(base + '/fixture?home=1');
  const canvas = second.getByRole('img', { name: 'Activity colors on the accepted shape' });
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => canvas.evaluate(el => {
   const pixels = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
   return pixels.some((value, index) => index % 4 === 0 && value > pixels[index + 1] + 20);
  })).toBe(true);

  const other = await (await profile(B)).newPage();
  await other.goto(reader(1));
  await expect(other.getByRole('heading', { name: 'Original cover' })).toBeVisible();
  assert.deepEqual(await chapterExchange(db, B), []);
 } finally {
  await Promise.all(contexts.map(context => context.close()));
  await db.close();
 }
});

for (const useDevice of [false, true]) {
 test(`Chapter conflict review can keep ${useDevice ? 'the device answers after a lost reply' : 'synced answers after a stale review'}`, { timeout: 120000, skip: !chapterPilot }, async () => {
  const chapter = createChapterDraft().chapter;
  chapter.id = 'review-chapter';
  chapter.title = 'Original Chapter';
  chapter.pages[1] = { type: 'short-text', id: 'question', question: 'Original question?', answerKey: 'answer', required: true };
  const newer = { ...chapter, version: 2, title: 'New Chapter' };
  const db = await chapterSyncDatabase([chapter, newer]);
  const contexts = [];
  let pauseSync = false, firstChoice, attempts = 0;
  const reader = base + '/fixture?reader=1&id=review-chapter&version=1';
  async function profile(isSecond = false) {
   const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
   contexts.push(context);
   await context.addInitScript(id => { window.fixtureAccount = id; }, A);
   await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/os/catalog') {
     if (url.searchParams.has('view')) return route.fulfill({ json: [{ id: chapter.id, title: newer.title, kind: 'chapter', version: 2 }] });
     const edition = url.searchParams.get('version') === '2' ? newer : chapter;
     return route.fulfill({ json: { version: edition.version, content: { kind: 'chapter', chapter: edition } } });
    }
    if (url.pathname !== '/os/catalog/chapter-sync') return route.continue();
    if (isSecond && pauseSync) return route.abort();
    const { owner, operation } = request.postDataJSON();
    const result = await chapterExchange(db, A, owner, operation);
    if (isSecond && useDevice && operation?.baseRevision === 2) {
     attempts++;
     if (!firstChoice) { firstChoice = operation; return route.abort(); }
     assert.deepEqual(operation, firstChoice);
    }
    return route.fulfill({ json: result });
   });
   return { context, page: await context.newPage() };
  }
  try {
   const first = await profile();
   await first.page.goto(reader);
   await first.page.getByRole('button', { name: 'Swipe to begin' }).click();
   await expect.poll(async () => (await chapterExchange(db, A))[0]?.revision).toBe(1);
   const second = await profile(true);
   await second.page.goto(base + '/os/explore');
   await expect(second.page.getByRole('link', { name: 'Open New Chapter' })).toBeVisible();
   await expect(second.page.getByRole('link', { name: 'Review answers' })).toHaveCount(0);
   await second.page.getByRole('link', { name: 'Open New Chapter' }).click();
   const answer = page => page.getByRole('textbox', { name: 'Original question?' });
   await expect(answer(second.page)).toBeVisible();
   await second.context.setOffline(true);
   await answer(second.page).fill('Offline answer');
   await second.page.getByRole('button', { name: 'Continue', exact: true }).click();
   await expect(second.page.getByText('Swipe when ready')).toBeVisible();
   if (!useDevice) {
    await second.page.evaluate(() => {
     document.addEventListener('click', event => {
      if (event.target.closest('a[href="/os/explore"]')) event.preventDefault();
     }, { capture: true });
    });
    const box = await second.page.getByLabel('Published chapter reading').boundingBox();
    assert.ok(box);
    const y = box.y + Math.min(150, box.height / 2);
    await second.page.mouse.move(box.x + box.width * .8, y);
    await second.page.mouse.down();
    await second.page.mouse.move(box.x + box.width * .2, y, { steps: 14 });
    await second.page.mouse.up();
    await expect(second.page.getByText('Chapter complete.')).toBeVisible();
   }
   await answer(first.page).fill('Synced answer');
   await first.page.getByRole('button', { name: 'Continue', exact: true }).click();
   await expect.poll(async () => (await chapterExchange(db, A))[0]?.revision).toBe(2);
   await second.context.setOffline(false);
   await expect(second.page.getByRole('link', { name: 'Review answers' })).toBeVisible({ timeout: 12000 });
   await second.page.goto(base + '/os/explore');
   const reviewLink = second.page.getByRole('link', { name: 'Review answers' });
   await expect(reviewLink).toHaveAttribute('href', /version=1&review=1$/);
   await reviewLink.click();
   await expect(second.page.getByRole('heading', { name: 'Original Chapter' })).toBeVisible();
   await expect(second.page.getByRole('region', { name: 'Synced answers' })).toContainText('Synced answer');
   await expect(second.page.getByRole('region', { name: 'On this device' })).toContainText('Offline answer');
   const synced = second.page.getByRole('button', { name: 'Use synced answers' });
   const device = second.page.getByRole('button', { name: 'Use this device’s answers' });
   if (!useDevice) await expect(device).toHaveCount(0);
   await expect.poll(() => synced.evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
   pauseSync = true;
   if (!useDevice) {
    const [head] = await chapterExchange(db, A);
    const revised = { ...head.run, answers: head.run.answers.map(answer => ({ ...answer, value: 'New synced answer', displaySnapshot: 'New synced answer' })) };
    assert.equal((await chapterExchange(db, A, A, { id: crypto.randomUUID(), baseRevision: 2, run: revised })).revision, 3);
   } else await second.context.setOffline(true);
   await (useDevice ? device : synced).click();
   await expect(second.page.getByText('Choice saved on this device. Waiting to sync.')).toBeVisible();
   if (useDevice) await second.context.setOffline(false);
   await second.page.reload();
   await expect(second.page.getByText('Choice saved on this device. Waiting to sync.')).toBeVisible();
   pauseSync = false;
   if (!useDevice) {
    await expect(second.page.getByText('The synced answers changed. Review both copies again.')).toBeVisible({ timeout: 12000 });
    await expect(second.page.getByRole('region', { name: 'Synced answers' })).toContainText('New synced answer');
    await synced.click();
   }
   await expect(second.page.getByText('Choice synced.')).toBeVisible({ timeout: 15000 });
   if (useDevice) assert.equal(attempts, 2);
   const [settled] = await chapterExchange(db, A);
   assert.equal(settled.revision, 3);
   assert.equal(settled.run.answers[0].value, useDevice ? 'Offline answer' : 'New synced answer');
   await second.page.reload();
   await second.page.getByText('Saved copies', { exact: true }).click();
   await expect(second.page.getByRole('region', { name: 'On this device' })).toContainText('Offline answer');
   await expect(second.page.getByRole('region', { name: 'Synced answers' })).toContainText(useDevice ? 'Synced answer' : 'New synced answer');
   await second.page.getByRole('link', { name: 'Continue Chapter' }).click();
   await expect(second.page.getByText('Swipe when ready')).toBeVisible();
  } finally {
   await Promise.all(contexts.map(context => context.close()));
   await db.close();
  }
 });
}

test('signed-in Article reader reloads exact content and retries its targeted image',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});let failImage=true;const reads=[];
 try{
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
 if(url.pathname==='/os/catalog'){reads.push(url.search);return route.fulfill({json:{version:1,content:{kind:'article',article:{title:'Original edition',summary:'Original summary',cover:{assetId:'33333333-3333-4333-8333-333333333333',alt:'Original tree'},blocks:[{id:'body',type:'paragraph',text:'Original words'}]}}}});}
 if(url.pathname==='/os/catalog/media')return failImage?route.fulfill({status:404,json:{error:'unavailable'}}):route.fulfill({json:{preview:base+'/reader-tree.svg'}});
 if(url.pathname==='/reader-tree.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100"/></svg>'});
 return route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>console.log('Reader fixture error',error.message));await page.goto(base+'/fixture?reader=1&id=original&version=1');await expect(page.getByRole('heading',{name:'Original edition',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Retry image'})).toBeVisible();failImage=false;await page.getByRole('button',{name:'Retry image'}).click();await expect.poll(()=>page.getByRole('img',{name:'Original tree',exact:true}).evaluate(img=>img.naturalWidth)).toBe(200);
 await page.reload();await expect(page.getByText('Original words',{exact:true})).toBeVisible();assert.equal(reads.length,2);assert.ok(reads.every(query=>query.includes('version=1')));
 }finally{await context.close();}
});

test('catalog publishing retries an uncertain operation and withdraws without removing version links',{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}});
 const draft=createChapterDraft();draft.chapter.id='catalog-synthetic';
 const items=[],posts=[];let first=true;
 try{
 await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(url.origin!==base)return route.abort();
 if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});
 if(url.pathname==='/os/admin/catalog')return route.fulfill({json:[{id:draft.draftId,draft,revision:1}]});
 if(url.pathname==='/os/catalog')return route.fulfill({json:items});
 if(url.pathname==='/os/admin/publications'){
 const command=request.postDataJSON();posts.push(command);
 if(first){first=false;return route.abort();}
 if(command.action==='publish'&&!items.length)items.push({id:draft.chapter.id,kind:'chapter',title:draft.chapter.title,version:1,revision:1,withdrawn:false});
 if(command.action==='withdraw'){items[0].withdrawn=true;items[0].revision++;}
 return route.fulfill({json:{version:1,revision:items[0].revision}});
 }return route.continue();});
 const page=await context.newPage();page.on('dialog',dialog=>dialog.accept());await page.goto(`${base}/fixture`);
 await page.getByRole('button',{name:'Catalog publishing',exact:true}).click();await page.getByRole('button',{name:'Open catalog',exact:true}).click();
 await page.getByRole('button',{name:'Publish version 1',exact:true}).click();await expect(page.getByRole('button',{name:'Retry pending change'})).toBeEnabled();
 await page.reload();await page.getByRole('button',{name:'Catalog publishing',exact:true}).click();await page.getByRole('button',{name:'Retry pending change'}).click();
 await expect(page.getByRole('link',{name:'Read v1',exact:true})).toBeVisible();assert.deepEqual(posts[0],posts[1]);
 await page.getByRole('button',{name:'Withdraw item',exact:true}).click();await expect(page.getByRole('button',{name:'Restore to catalog',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Read v1',exact:true})).toBeVisible();
 }finally{await context.close();}
});
test('new chapter glass and article image drafting survive save and reload', {timeout:90000}, async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900}}); const rows=[];const errors=[];
 try {
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(url.pathname==='/content-tree.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="orange"/></svg>'});if(url.pathname==='/os/admin/status')return route.fulfill({json:{admin:true}});if(url.pathname==='/os/admin/media')return route.fulfill({json:[{id:'11111111-2222-4333-8444-555555555555',alt:'A tree',preview:`${base}/content-tree.svg`}]});if(url.pathname==='/os/admin/catalog'){if(route.request().method()==='POST'){const body=route.request().postDataJSON();const index=rows.findIndex(row=>row.id===body.draft.draftId);if(index>=0)rows.splice(index,1);rows.unshift({id:body.draft.draftId,draft:body.draft,revision:1});return route.fulfill({json:{revision:1}});}return route.fulfill({json:rows});}return route.continue();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(`${base}/fixture`);
  await page.getByRole('button',{name:'Blank chapter',exact:true}).click();await expect(page.locator('.os-chapter-session')).toHaveClass(/os-content-glass/);
  await expect(page.locator('.os-chapter-session')).toHaveCSS('backdrop-filter', 'blur(12px) saturate(1.2)');
  await page.getByRole('button',{name:'Choose image',exact:true}).click();await page.getByLabel('Image',{exact:true}).selectOption('11111111-2222-4333-8444-555555555555');await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect.poll(()=>rows.length).toBe(1);assert.equal(rows[0].draft.chapter.pages[0].image.alt,'A tree');await page.locator('.os-chapter-session').screenshot({path:'outputs/new-chapter-glass.png'});const anchor=await page.locator('.os-chapter-session').evaluate(frame=>{const box=frame.getBoundingClientRect();const text=frame.querySelector('[aria-label="Edit cover title"]').getBoundingClientRect();return {top:text.top-box.top,left:text.left-box.left,height:box.height};});console.log('New glass chapter geometry',anchor);assert.ok(Math.abs(anchor.top-25)<2,JSON.stringify(anchor));assert.ok(Math.abs(anchor.left-25)<2,JSON.stringify(anchor));
  await page.getByRole('button',{name:'Articles',exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Synthetic article');await page.getByLabel('Summary',{exact:true}).fill('A synthetic summary.');
  await page.getByRole('button',{name:'Add paragraph',exact:true}).click();await page.getByLabel('Block text',{exact:true}).fill('Some words.');
  await page.getByRole('button',{name:'Choose image',exact:true}).click();await page.getByLabel('Image',{exact:true}).selectOption('11111111-2222-4333-8444-555555555555');
  await page.getByLabel('Caption',{exact:true}).fill('Morning tree');await page.getByRole('button',{name:'Save article',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved online'})).toBeVisible();
  await expect(page.locator('.os-article-preview')).toHaveCSS('backdrop-filter', 'blur(12px) saturate(1.2)');
  assert.equal(rows[0].draft.article.cover.alt,'A tree');await page.reload();await page.getByRole('button',{name:'Articles',exact:true}).click();await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Synthetic article');await expect(page.getByLabel('Block text',{exact:true})).toHaveValue('Some words.');await expect(page.locator('.os-article-preview')).toHaveClass(/os-content-glass/);await expect.poll(()=>page.locator('.os-article-preview img').evaluate(img=>img.naturalWidth)).toBe(200);await page.screenshot({path:'outputs/new-article-glass.png',fullPage:true});await expect(page.getByLabel('Summary',{exact:true})).toHaveValue('A synthetic summary.');const positions=await page.locator('.os-article-preview').evaluate(article=>{const children=[...article.children];return children.slice(0,3).map(node=>node.getBoundingClientRect().top);});assert.ok(positions[0]<positions[1]&&positions[1]<positions[2]);const order=await page.locator('.os-article-preview').evaluate(article=>[...article.children].slice(0,3).map(node=>node.tagName));assert.deepEqual(order,['FIGURE','H1','P']);const fields=await page.locator('fieldset').evaluate(form=>[...form.children].slice(0,4).map(node=>node.tagName));assert.deepEqual(fields,['H2','SECTION','LABEL','LABEL']);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
before(async () => {
 const harness=`
 import React from 'react';import{createRoot}from'react-dom/client';
 import{AccountAdmin}from'/app/os/admin/account-admin.tsx';
 import{SupabaseConnection}from'/app/os/auth/supabase-context.tsx';
 import{activateAccountScope,getAccountScope}from'/app/os/account-scope.js';
 ${useProductionCSS?'':"import'/app/globals.css';import'/app/os/os-app.css';import'/app/os/content-glass.css';"}
 const account=window.fixtureAccount||'synthetic-admin';
 activateAccountScope(account);
 const value={client:{auth:{getSession:async()=>({data:{session:{access_token:window.fixtureAccount||'synthetic-token',user:{id:account}}}})}},config:{}};
 let surface=React.createElement(AccountAdmin);
 if(location.search.includes('menu=1')){const {AccountMenu}=await import('/app/os/auth/account-menu.tsx');const {AccountContext}=await import('/app/os/auth/account-context.tsx');surface=React.createElement(AccountContext.Provider,{value:{accountId:'synthetic-admin',alias:'Synthetic',busy:false,message:'',saveAlias:async()=>true,signOut:async()=>{}}},React.createElement(AccountMenu));}
 if(location.search.includes('reader=1')||location.pathname==='/os/catalog/read'){const {default:Reader}=await import('/app/os/catalog/read/page.tsx');const {CircleStateProvider,useCircleState}=await import('/app/os/circle-os-shell.tsx');const {useCatalogDefinitions}=await import('/app/os/catalog/definitions.ts');function Probe(){const context=useCircleState();window.readerState=context.state;window.readerUpdate=context.updateState;window.readerPulses=context.localImprint.takePulses;window.readerDefinitions=useCatalogDefinitions(context.state.chapters.runs);return null;}surface=React.createElement(CircleStateProvider,null,React.createElement(Probe),React.createElement(Reader));}
 if(location.pathname==='/os/explore'){const {default:Explore}=await import('/app/os/explore/page.tsx');const {CircleStateProvider}=await import('/app/os/circle-os-shell.tsx');surface=React.createElement(CircleStateProvider,null,React.createElement(Explore));}
 if(location.search.includes('home=1')){const {default:Home}=await import('/app/os/home/page.tsx');const {CircleStateProvider}=await import('/app/os/circle-os-shell.tsx');const {WritingProvider}=await import('/app/os/writing-provider.tsx');surface=React.createElement(CircleStateProvider,null,React.createElement(WritingProvider,{scope:getAccountScope(),enabled:true,answers:[],memory:{}},React.createElement(Home)));}
 const admin=React.createElement(SupabaseConnection.Provider,{value},surface);
 const route=React.createElement('div',{className:'os-route-stage is-ready'},React.createElement('div',null,React.createElement('div',{className:'os-route-content'},admin)));
 createRoot(document.getElementById('root')).render(React.createElement('div',{className:'circle-os'},React.createElement('div',{className:'os-app-shell'},route)));
 `;
 const env = { NODE_ENV:'development', CIRCLE_IMPRINT_HOSTED_REVIEW:'enabled',
  ...(chapterPilot ? { NEXT_PUBLIC_CIRCLE_CHAPTER_SYNC: 'pilot', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' } : {}) };
 const fixturePaths = chapterPilot ? ['/fixture', '/os/catalog/read', '/os/explore'] : ['/fixture'];
 server=await createServer({configFile:false,define:{'process.env':JSON.stringify(env)},plugins:[react(),{name:'admin-fixture',resolveId(id){if(id==='virtual:admin')return '\0admin.tsx';},load(id){if(id==='\0admin.tsx')return harness+'window.adminSwitch=activateAccountScope;';},configureServer(vite){vite.middlewares.use(async(req,res,next)=>{if(useProductionCSS&&req.url==='/fixture-production.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(productionStyles);return;}if(!fixturePaths.includes(req.url?.split('?')[0]))return next();res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await vite.transformIndexHtml('/fixture','<meta name="viewport" content="width=device-width,initial-scale=1">'+(useProductionCSS?'<link rel="stylesheet" href="/fixture-production.css">':'')+'<div id="root"></div><script type="module" src="/@id/virtual:admin"></script>'));});}}],server:{host:'127.0.0.1',port:0,watch:{ignored:['**/.next/**','**/dist/**']}}});
 await server.listen();base=`http://127.0.0.1:${server.httpServer.address().port}`;browser=await chromium.launch();
});

for(const width of [360,416,640,1280]) test(`Media picker, upload retry and thumbnail gallery at ${width}px`,{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width,height:900}});
 const posts=[],errors=[],external=[];
 const assets=Array.from({length:8},(_,index)=>({id:`synthetic-image-${index}`,alt:index===4?'A-long-synthetic-caption-without-spaces-'.repeat(4):`Synthetic landscape ${index+1}`,preview:index===7?null:`${base}/fixture-media-${index}.svg`}));
 const file={name:'A synthetic image with a long filename for the phone gallery.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')};
 let releaseFailure,releaseSuccess;
 const failureGate=new Promise(resolve=>{releaseFailure=resolve;}),successGate=new Promise(resolve=>{releaseSuccess=resolve;});
 try {
  await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedAdminReference=value;}}});});
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==base){external.push(request.url());return route.abort();}
   if(url.pathname.startsWith('/fixture-media-')){
    const index=Number(url.pathname.match(/(\d+)\.svg$/)[1]);
    return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${index%2?800:1200}" height="${index%2?1200:800}" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="800" fill="${['#403E35','#B35A35','#7B8171','#786552'][index%4]}"/><circle cx="900" cy="180" r="100" fill="#F1EFE8"/><path d="M0 800 380 240 760 800 980 420 1200 800" fill="#191813"/></svg>`});
   }
   if(!url.pathname.startsWith('/os/admin/'))return route.continue();
   assert.equal(request.headers().authorization,'Bearer synthetic-token');
   if(url.pathname.endsWith('/status'))return route.fulfill({json:{admin:true}});
   if(url.pathname.endsWith('/catalog'))return route.fulfill({json:[]});
   if(url.pathname.endsWith('/media')&&request.method()==='GET')return route.fulfill({json:assets});
   if(url.pathname.endsWith('/media')&&request.method()==='POST'){
    const form=await new Request(request.url(),{method:'POST',headers:request.headers(),body:request.postDataBuffer()}).formData(),image=form.get('image');
    posts.push({id:form.get('id'),alt:form.get('alt'),name:image.name,type:image.type,bytes:[...new Uint8Array(await image.arrayBuffer())]});
    if(posts.length===1){await failureGate;return route.fulfill({status:503,json:{error:'Synthetic upload failed. Keep the file and retry.'}});}
    await successGate;assets.unshift({id:'synthetic-upload',alt:form.get('alt'),preview:`${base}/fixture-media-8.svg`});return route.fulfill({json:{saved:true}});
   }
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/fixture`);await page.getByRole('button',{name:'Media',exact:true}).click();
  const choose=page.getByRole('button',{name:'Choose file',exact:true}),upload=page.getByRole('button',{name:'Upload image',exact:true}),alt=page.getByLabel('Alternative text'),gallery=page.getByRole('region',{name:'Image library'});
  await expect(gallery.locator('figure')).toHaveCount(8);await expect(upload).toBeDisabled();
  await expect(upload).toHaveCSS('background-color','rgb(227, 107, 55)');await expect(choose).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(upload).toHaveCSS('font-weight','700');await expect(choose).toHaveCSS('font-weight','700');
  await expect(page.getByText('No file chosen',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Media',exact:true}).focus();await page.keyboard.press('Tab');await expect(choose).toBeFocused();await expect(choose).toHaveCSS('outline-style','solid');
  const chooserOpened=page.waitForEvent('filechooser');await choose.click();const chooser=await chooserOpened;
  assert.equal(chooser.isMultiple(),false);await chooser.setFiles(file);
  await expect(page.getByText(file.name,{exact:true})).toBeVisible();await expect(upload).toBeDisabled();assert.equal(posts.length,0);
  await alt.fill('   ');await expect(upload).toBeDisabled();await alt.fill('A synthetic new image.');await expect(upload).toBeEnabled();
  for(const image of await gallery.locator('img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);}
  const metrics=await gallery.evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,width:el.getBoundingClientRect().width,available:el.closest('.os-app-shell').clientWidth-32,tiles:[...el.querySelectorAll('.os-admin-media-thumbnail')].map(tile=>{const box=tile.getBoundingClientRect();return{width:box.width,height:box.height,top:box.top};}),fits:[...el.querySelectorAll('img')].map(img=>getComputedStyle(img).objectFit),overflow:document.documentElement.scrollWidth>innerWidth}));
  const columns=width<640?3:4;assert.equal(metrics.columns,columns);assert.equal(metrics.overflow,false);
  assert.ok(Math.abs(metrics.width-metrics.available)<1,'gallery fills the real app shell between its existing gutters');
  for(const tile of metrics.tiles)assert.ok(Math.abs(tile.width-tile.height)<1,JSON.stringify(tile));
  for(const tile of metrics.tiles.slice(0,columns))assert.ok(Math.abs(tile.top-metrics.tiles[0].top)<1);
  assert.ok(metrics.tiles[columns].top>metrics.tiles[0].top);assert.ok(metrics.fits.every(fit=>fit==='cover'));
  for(const button of [choose,upload,...await gallery.getByRole('button').all()]){const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44,JSON.stringify(box));}
  await expect(gallery.getByText('Preview unavailable',{exact:true})).toBeVisible();
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`outputs/admin-media-${width}${useProductionCSS?'-production':''}.png`,fullPage:true});
  await upload.click();const busy=page.getByRole('button',{name:'Uploading…',exact:true});await expect(busy).toBeDisabled();await expect(choose).toBeDisabled();await expect(alt).toBeDisabled();await expect.poll(()=>posts.length).toBe(1);
  await gallery.getByRole('button').first().click();await expect(page.getByRole('status')).toHaveText('Image reference copied.');assert.equal(await page.evaluate(()=>window.copiedAdminReference),'synthetic-image-0');await expect(busy).toBeDisabled();
  await page.locator('form').evaluate(form=>form.requestSubmit());releaseFailure();
  await expect(page.getByRole('status')).toHaveText('Synthetic upload failed. Keep the file and retry.');
  await expect(page.getByText(file.name,{exact:true})).toBeVisible();await expect(alt).toHaveValue('A synthetic new image.');await expect(upload).toBeEnabled();
  await upload.click();await expect.poll(()=>posts.length).toBe(2);assert.deepEqual(posts[1],posts[0]);assert.match(posts[0].id,/^[0-9a-f-]{36}$/);assert.equal(posts[0].name,file.name);assert.equal(posts[0].type,file.mimeType);assert.deepEqual(posts[0].bytes,[...file.buffer]);
  releaseSuccess();await expect(page.getByRole('status')).toHaveText('Image uploaded.');await expect(gallery.locator('figure')).toHaveCount(9);await expect(alt).toHaveValue('');await expect(upload).toBeDisabled();await expect(choose).toBeEnabled();
  await expect(page.getByText('No file chosen',{exact:true})).toBeVisible();assert.equal(await page.locator('input[type=file]').evaluate(el=>el.files.length),0);
  await page.reload();await page.getByRole('button',{name:'Media',exact:true}).click();await expect(gallery.locator('figure')).toHaveCount(9);
  const reselectOpened=page.waitForEvent('filechooser');await choose.click();await(await reselectOpened).setFiles(file);await expect(page.getByText(file.name,{exact:true})).toBeVisible();
  console.log('Media gallery',width,JSON.stringify(metrics));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 } finally {releaseFailure();releaseSuccess();await context.close();}
});
test('late decoded Admin drafts never enter the next account cache', {timeout:90000}, async()=>{
 const context=await browser.newContext();
 try {
  await context.addInitScript(()=>{
   const native=window.fetch.bind(window);
   window.fetch=async(...args)=>{
    const response=await native(...args);
    if(String(args[0]).endsWith('/os/admin/catalog')) {
     const json=response.json.bind(response);
     response.json=async()=>{const value=await json();window.adminBodyWaiting=true;await new Promise(resolve=>{window.releaseAdminBody=resolve;});return value;};
    }
    return response;
   };
  });
  const draft=createChapterDraft();draft.draftId='synthetic-late-admin';
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
   if(url.pathname.endsWith('/os/admin/status'))return route.fulfill({json:{admin:true}});
   if(url.pathname.endsWith('/os/admin/catalog'))return route.fulfill({json:[{id:draft.draftId,draft,revision:1}]});
   return route.continue();
  });
  const page=await context.newPage();await page.goto(`${base}/fixture`);
  await page.waitForFunction(()=>window.adminBodyWaiting);
  await page.evaluate(()=>{window.adminSwitch('synthetic-other');window.releaseAdminBody();});
  await expect(page.getByText('Could not open shared drafts. Existing device copies are retained.')).toBeVisible();
  const contaminated=await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('circle-admin:synthetic-other:')));
  assert.deepEqual(contaminated,[]);
 } finally {await context.close();}
});
after(async()=>{await browser?.close();await server?.close();});
for(const width of [360,1280]) test(`account Admin draft recovery and media at ${width}px`,{timeout:90000},async()=>{
 const context=await browser.newContext({viewport:{width,height:900}});let rows=[],fail=false;const errors=[];
 try{
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(!url.pathname.startsWith('/os/admin/'))return route.continue();assert.equal(route.request().headers().authorization,'Bearer synthetic-token');
 if(url.pathname.endsWith('/status'))return route.fulfill({json:{admin:true}});
 if(url.pathname.endsWith('/media'))return route.fulfill({json:[]});
 if(route.request().method()==='GET')return route.fulfill({json:rows});
 if(fail)return route.fulfill({status:503,json:{error:'Synthetic connection failure. Device copy retained.'}});
 const data=route.request().postDataJSON();rows=[{id:data.draft.draftId,draft:data.draft,revision:1}];return route.fulfill({json:{revision:1}});
 });
 const page=await context.newPage();page.on('pageerror',error=>{errors.push(error.message);process.stderr.write(error.stack+'\n');});
 await page.goto(`${base}/fixture`);await page.getByRole('button',{name:'Blank chapter',exact:true}).click();
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.getByText('Saved online',{exact:true})).toBeVisible();assert.equal(rows.length,1);
 await page.locator('details').evaluateAll(elements=>elements.forEach(el=>el.open=true));await page.getByLabel('Title',{exact:true}).fill('Recovered synthetic title');
 fail=true;await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.getByText(/Synthetic connection failure/)).toBeVisible();
 assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('circle-admin-recovery:synthetic-admin:'))));
 await page.reload();await page.getByLabel('Search',{exact:true}).fill('Recovered synthetic title');await page.locator('details').evaluateAll(elements=>elements.forEach(el=>el.open=true));await expect(page.locator('.os-admin-draft-open')).toHaveCount(1);await page.locator('.os-admin-draft-open').click();await page.locator('details').evaluateAll(elements=>elements.forEach(el=>el.open=true));await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Recovered synthetic title');
 await page.getByRole('button',{name:'Media',exact:true}).click();await expect(page.getByRole('heading',{name:'Media',exact:true})).toBeVisible();await expect(page.getByLabel('Alternative text')).toBeVisible();
 assert.ok(await page.getByRole('button',{name:'Upload image'}).evaluate(el=>el.getBoundingClientRect().height)>=44);
 assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
