import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startImprintPreview} from './preview-personal-imprint.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA||'','ms-playwright');
const {chromium}=await import('@playwright/test');
const server=await startImprintPreview(3038),results=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [360,390,416,1280]){
  const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Bangkok'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3038/?study=activity',{waitUntil:'networkidle'});
  const canvas=page.getByRole('img',{name:'Activity colors on the accepted shape'});
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');
  const pixels=()=>canvas.evaluate(c=>c.toDataURL());
  const initial=await pixels();assert.equal(await canvas.getAttribute('data-pulsing'),'false');
  const counts=()=>page.getByLabel('Activity totals').innerText();
  const original=await counts();
  await page.getByRole('button',{name:'Fail action',exact:true}).click();assert.equal(await counts(),original);assert.equal(await pixels(),initial);
  await page.getByRole('button',{name:'Accept action',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.pulsing==='true');
  await page.waitForFunction(baseline=>document.querySelector('canvas')?.toDataURL()!==baseline,initial);
  assert.equal(await counts(),original); // already used Notes today
  await page.getByRole('button',{name:'Accept action',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.pulsing==='false');
  assert.equal(await pixels(),initial);
  await page.getByRole('button',{name:'Retry last action',exact:true}).click();assert.equal(await counts(),original);
  assert.equal(await canvas.getAttribute('data-pulsing'),'false');
  await page.getByRole('button',{name:'Edit saved Note',exact:true}).click();assert.equal(await counts(),original);
  await page.getByRole('button',{name:'Save future Log block',exact:true}).click();assert.equal(await counts(),original);
  await page.getByRole('button',{name:'Reload synthetic records',exact:true}).click();assert.equal(await pixels(),initial);
  await page.getByLabel('Fictional person').selectOption('sample-two');
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');
  assert.match(await counts(),/notes: 1 used days/);
  const second=await pixels();
  await page.getByRole('button',{name:'Move to Trash',exact:true}).click();assert.match(await counts(),/notes: 0 used days/);
  assert.notEqual(await pixels(),second);
  await page.getByRole('button',{name:'Restore source',exact:true}).click();assert.equal(await pixels(),second);
  assert.equal(await canvas.getAttribute('data-pulsing'),'false');
  await page.getByRole('button',{name:'Just before cutoff',exact:true}).click();assert.equal(await pixels(),second);
  await page.getByRole('button',{name:'At cutoff',exact:true}).click();const faded=await pixels();assert.notEqual(faded,second);
  await page.getByRole('button',{name:'One quiet month later',exact:true}).click();assert.equal(await pixels(),faded);
  await page.getByRole('button',{name:'Undo source',exact:true}).click();assert.match(await counts(),/notes: 0 used days/);
  await page.getByRole('button',{name:'Restore source',exact:true}).click();assert.equal(await pixels(),faded);
  await page.getByRole('button',{name:'Archive definition',exact:true}).click();assert.equal(await pixels(),faded);
  await page.getByRole('button',{name:'Clear source',exact:true}).click();assert.match(await counts(),/notes: 0 used days/);
  await page.getByRole('button',{name:'Restore source',exact:true}).click();
  await page.getByRole('button',{name:'Delete source',exact:true}).click();await page.getByRole('button',{name:'Restore source',exact:true}).click();assert.match(await counts(),/notes: 0 used days/);
  assert.equal(await canvas.evaluate(async c=>{const r=await fetch('/docs/design/personal-imprint-color-v1.json'),report=await r.json(),sample=report.samples.find(s=>s.id==='sori'),image=await createImageBitmap(await (await fetch('/'+sample.outputs.bone.path)).blob()),scratch=document.createElement('canvas');scratch.width=c.width;scratch.height=c.height;scratch.getContext('2d').drawImage(image,0,0);image.close();return scratch.toDataURL()===c.toDataURL();}),true);
  await page.getByLabel('Action',{exact:true}).selectOption('task-completed');await page.getByLabel('Complete task from').selectOption('unknown');
  await page.getByRole('button',{name:'Accept action',exact:true}).click();assert.match(await counts(),/log-week: 0 used days/);
  await page.getByLabel('Complete task from').selectOption('week');await page.getByRole('button',{name:'Accept action',exact:true}).click();assert.match(await counts(),/log-week: 1 used days/);
  await page.getByRole('button',{name:'Reload synthetic records',exact:true}).click();assert.equal(await canvas.getAttribute('data-pulsing'),'false');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');
  assert.equal(await counts(),original);assert.equal(await canvas.getAttribute('data-pulsing'),'false');
  if(width===390){for(const id of await page.getByLabel('Accepted shape',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>o.value))){await page.getByLabel('Accepted shape',{exact:true}).selectOption(id);await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');assert.equal(await canvas.getAttribute('data-pulsing'),'false');}await page.getByLabel('Accepted shape',{exact:true}).selectOption('sori');await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');}
  const measurements=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,storage:localStorage.length+sessionStorage.length,smallTargets:[...document.querySelectorAll('button,select,a')].filter(n=>n.getBoundingClientRect().height<44).map(n=>n.textContent)}));
  assert.equal(measurements.overflow,false);assert.equal(measurements.storage,0);assert.deepEqual(measurements.smallTargets,[]);assert.deepEqual(errors,[]);
  await page.screenshot({path:`outputs/imprint/activity-${width}.png`,fullPage:true});
  if(width===390)await canvas.screenshot({path:'outputs/imprint/activity-interactive-390.png'});
  results.push({width,...measurements,errors,passed:true});await context.close();
 }
 const context=await browser.newContext({reducedMotion:'reduce',timezoneId:'Asia/Bangkok'}),page=await context.newPage();
 await page.goto('http://127.0.0.1:3038/?study=activity',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true');
 await page.getByRole('button',{name:'Accept action',exact:true}).click();assert.equal(await page.locator('canvas').getAttribute('data-pulsing'),'false');
 results.push({scenario:'reduced-motion',passed:true});await context.close();
 for(const scenario of ['missing','incomplete','corrupt']){
  const c=await browser.newContext(),p=await c.newPage();
  if(scenario==='corrupt')await p.route('**/*coordinates.bin*',r=>r.fulfill({body:'corrupt'}));
  else await p.route('**/personal-imprint-growth-v1.json',r=>r.fulfill(scenario==='missing'?{status:503,body:'no'}:{contentType:'application/json',body:'{"ready":false}'}));
  await p.goto('http://127.0.0.1:3038/?study=activity',{waitUntil:'networkidle'});await p.getByRole('alert').waitFor();
  results.push({scenario,passed:true});await c.close();
 }
 console.log(JSON.stringify(results));
}finally{await writeFile('outputs/imprint/activity-browser.json',JSON.stringify(results,null,2)+'\n');await browser?.close();await server.close();}
