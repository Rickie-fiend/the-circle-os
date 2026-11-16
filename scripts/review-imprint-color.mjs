import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import path from 'node:path';
import {startImprintPreview} from './preview-personal-imprint.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ||=path.join(process.env.LOCALAPPDATA||'','ms-playwright');
const {chromium}=await import('@playwright/test'),report=JSON.parse(await readFile('docs/design/personal-imprint-color-v1.json','utf8'));
if(!report.ready)throw Error('Color render is not ready');
const hash=b=>createHash('sha256').update(b).digest('hex'),results=[],server=await startImprintPreview(3036),origin='http://127.0.0.1:3036';let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir('outputs/imprint',{recursive:true});
 for(const width of [360,390,416,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
  await page.goto(origin+'/?study=color',{waitUntil:'networkidle'});await page.getByRole('status').filter({hasText:'visual review pending'}).waitFor();
  const modes=width===390?Object.keys(report.states):['mixed','bone','notes','older'];
  const images=[];for(const mode of modes){
   await page.getByLabel('Color example',{exact:true}).selectOption(mode);
   await page.locator('.imprint-loop-grid img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
   const sources=await page.locator('.imprint-loop-grid img').evaluateAll(ns=>ns.map(n=>n.getAttribute('src')));
   for(let i=0;i<sources.length;i++){const r=await page.request.get(new URL(sources[i],origin).href);images.push(hash(await r.body())===report.samples[i].outputs[mode].hash);}
  }
  await page.getByRole('status').filter({hasText:'Loading color data'}).waitFor({state:'detached'});
  await page.getByRole('button',{name:'Reset to Bone'}).click();
  const reset=await page.locator('canvas').evaluate(async canvas=>{
   const context=canvas.getContext('2d'),pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
   const r=await fetch('/docs/design/personal-imprint-color-v1.json'),report=await r.json(),sample=report.samples.find(s=>s.id==='sori');
   const image=await createImageBitmap(await (await fetch('/'+sample.outputs.bone.path)).blob()),scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;const c=scratch.getContext('2d');c.drawImage(image,0,0);const before=c.getImageData(0,0,scratch.width,scratch.height).data;
   return pixels.every((v,i)=>v===before[i]);
  });
  await page.getByLabel('Orange strength').fill('0.95');
  const colored=await page.locator('canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).some((v,i,a)=>i%4===0&&v>a[i+1]*1.3&&v>30));
  await page.getByLabel('Color example',{exact:true}).selectOption('mixed');await page.locator('img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
  await page.evaluate(()=>document.fonts.ready);
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('16px "Imprint Review Geist"'),storage:localStorage.length+sessionStorage.length,targets:[...document.querySelectorAll('select,input,button,a')].every(n=>n.getBoundingClientRect().height>=44)}));
  await page.screenshot({path:`outputs/imprint/color-preview-${width}.png`,fullPage:true});if(width===1280)await page.locator('.imprint-loop-grid').screenshot({path:'outputs/imprint/color-comparison.png'});
  await page.reload({waitUntil:'networkidle'});await page.getByLabel('Color example',{exact:true}).waitFor();
  results.push({width,...layout,reset,colored,images:images.length,errors,external,passed:reset&&colored&&images.every(Boolean)&&!layout.overflow&&layout.font&&!layout.storage&&layout.targets&&!errors.length&&!external.length&&!(await context.cookies()).length});await context.close();
 }
 for(const scenario of ['missing','incomplete','corrupt-coordinates']){
  const context=await browser.newContext(),page=await context.newPage();
  if(scenario==='corrupt-coordinates')await page.route('**/*-coordinates.bin*',r=>r.fulfill({body:'corrupt'}));
  else await page.route('**/personal-imprint-color-v1.json',r=>r.fulfill(scenario==='missing'?{status:503,body:'unavailable'}:{contentType:'application/json',body:JSON.stringify({ready:false})}));
  await page.goto(origin+'/?study=color',{waitUntil:'networkidle'});
  if(scenario==='corrupt-coordinates')await page.getByRole('alert').waitFor();else await page.getByRole('status').filter({hasText:scenario==='missing'?'unavailable':'not ready'}).waitFor();
  results.push({scenario,passed:scenario==='corrupt-coordinates'?await page.locator('.imprint-loop-grid img').count()===6:await page.locator('img').count()===0});await context.close();
 }
 await writeFile('outputs/imprint/color-browser.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));if(results.some(r=>!r.passed))process.exitCode=1;
}finally{await browser?.close();await server.close();}
