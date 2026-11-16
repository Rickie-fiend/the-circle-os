import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startImprintPreview} from './preview-personal-imprint.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA||'','ms-playwright');
const {chromium}=await import('@playwright/test'),server=await startImprintPreview(3034),origin='http://127.0.0.1:3034',results=[],hash=b=>createHash('sha256').update(b).digest('hex');let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir('outputs/imprint',{recursive:true});
 for(const width of [360,390,416,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:'))external.push(r.url());});
  await page.goto(origin+'/?study=sori-depth',{waitUntil:'networkidle'});await page.getByRole('status').filter({hasText:'Construction checks complete'}).waitFor();
  await page.getByText('Inspect the depth',{exact:true}).click();await page.locator('img').evaluateAll(async nodes=>Promise.all(nodes.map(n=>n.decode())));await page.evaluate(()=>document.fonts.ready);
  const measurements=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('16px "Imprint Review Geist"'),storage:localStorage.length+sessionStorage.length,targets:[...document.querySelectorAll('a,summary')].every(n=>n.getBoundingClientRect().height>=44),images:[...document.images].map(n=>({src:n.getAttribute('src'),loaded:n.complete&&n.naturalWidth>0}))}));
  const assets=[];for(const img of measurements.images){const url=new URL(img.src,origin),response=await page.request.get(url.href);assets.push(response.ok()&&hash(await response.body())===hash(await readFile(url.pathname.slice(1))));}
  const links=[];for(const href of await page.locator('a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')))){const response=await page.request.get(new URL(href,origin).href);links.push(response.ok());}
  await page.screenshot({path:`outputs/imprint/sori-v4-preview-${width}.png`,fullPage:true});if(width===1280)await page.locator('.imprint-master-comparison').first().screenshot({path:'outputs/imprint/sori-v4-comparison.png'});
  await page.reload({waitUntil:'networkidle'});await page.getByRole('status').filter({hasText:'Construction checks complete'}).waitFor();
  results.push({width,...measurements,errors,external,passed:!measurements.overflow&&measurements.font&&!measurements.storage&&measurements.targets&&measurements.images.length===5&&measurements.images.every(i=>i.loaded)&&assets.every(Boolean)&&links.every(Boolean)&&!(await context.cookies()).length&&!errors.length&&!external.length});await context.close();
 }
 for(const scenario of ['missing','rejected']){
  const context=await browser.newContext(),page=await context.newPage();
  await page.route('**/personal-imprint-sori-v4-inspection.json',r=>r.fulfill(scenario==='missing'?{status:503,body:'unavailable'}:{status:200,contentType:'application/json',body:JSON.stringify({readyForReview:false,outputs:{}})}));
  await page.goto(origin+'/?study=sori-depth',{waitUntil:'networkidle'});const message=await page.getByRole('status').innerText();
  results.push({scenario,message,passed:(scenario==='missing'?message.includes('Inspection unavailable'):message.includes('needs further work'))&&await page.locator('img').count()===0});await context.close();
 }
 await writeFile('outputs/imprint/sori-v4-browser.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(r=>({width:r.width,scenario:r.scenario,passed:r.passed,errors:r.errors,external:r.external}))));if(results.some(r=>!r.passed))process.exitCode=1;
}finally{await browser?.close();await server.close();}
