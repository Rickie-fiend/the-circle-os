// Isolated browser checks for the approved six-form, closed-loop prototype.
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {startImprintPreview} from "./preview-personal-imprint.mjs";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA||"","ms-playwright");
const {chromium}=await import("@playwright/test"),base="docs/design/personal-imprint-loops-v2",manifest=JSON.parse(await readFile(`${base}-inspection.json`,"utf8"));
const server=await startImprintPreview(3032),origin="http://127.0.0.1:3032",results=[],hash=v=>createHash("sha256").update(v).digest("hex");
let browser;
async function verifyImages(page,mode){
 await page.locator(".imprint-loop-grid img").evaluateAll(async nodes=>{await Promise.all(nodes.map(n=>n.decode()));});
 const images=await page.locator(".imprint-loop-grid img").evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute("src"),loaded:n.complete&&n.naturalWidth>0})));
 const served=[];
 for(let i=0;i<images.length;i++){
  const expected=manifest.samples[i].outputs[mode],url=new URL(images[i].src,origin),response=await page.request.get(url.href);
  served.push({id:manifest.samples[i].id,loaded:images[i].loaded,passed:url.pathname===`/${expected.path}`&&url.searchParams.get("v")===expected.hash&&hash(await response.body())===expected.hash});
 }
 return {mode,served,passed:images.length===6&&served.every(s=>s.loaded&&s.passed)};
}
try{
 browser=await chromium.launch({headless:true});await mkdir("outputs/imprint",{recursive:true});
 for(const width of [360,390,416,1280]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1}),page=await context.newPage(),errors=[],external=[],actions=[],traces=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{if(!request.url().startsWith(origin)&&!request.url().startsWith("data:"))external.push(request.url());});
  await page.goto(origin,{waitUntil:"networkidle"});await page.getByLabel("Choose a strand",{exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  const threads=await verifyImages(page,"full");
  await page.getByRole("button",{name:"Silhouettes",exact:true}).click();await page.waitForLoadState("networkidle");const silhouettes=await verifyImages(page,"silhouette");
  if(width===1280)await page.locator(".imprint-loop-grid").screenshot({path:"outputs/imprint/loops-v2-silhouettes.png"});
  await page.getByRole("button",{name:"Thread forms",exact:true}).click();
  for(const sample of manifest.samples){
   await page.getByLabel("Choose a fictional profile").selectOption(sample.id);
   await page.getByLabel("Choose a strand",{exact:true}).waitFor();
   for(const[label,expected]of [["Repeat answers","Repeated answers kept the same sculpture."],["Reorder answers","Reordered answers kept the same sculpture."],["Correct profile","Profile correction kept the original sculpture."],["Try missing name","Add a name to make the sample form."]]){
    const before=await page.locator(".imprint-loop-grid img").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("src")));
    await page.getByRole("button",{name:label,exact:true}).click();await page.getByRole("status").filter({hasText:expected}).waitFor();
    const after=await page.locator(".imprint-loop-grid img").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("src")));
    actions.push({id:sample.id,action:label,passed:JSON.stringify(before)===JSON.stringify(after),message:await page.getByRole("status").innerText()});
   }
   const response=await page.request.get(`${origin}/${sample.outputs.selected.path}`),selected=await response.json();
   for(const index of width===390?[0,1,2]:[0]){
    await page.getByLabel("Choose a strand",{exact:true}).selectOption(String(index));
    await page.getByRole("button",{name:"Front view",exact:true}).click();const front=await page.locator(".imprint-loop-trace path").getAttribute("d");
    await page.getByRole("button",{name:"Angled view",exact:true}).click();const angled=await page.locator(".imprint-loop-trace path").getAttribute("d");
    const loop=selected[index],first=loop.route[0],last=loop.route.at(-1);
    traces.push({id:sample.id,index,passed:hash(await response.body())===sample.outputs.selected.hash&&loop.closed&&loop.ends.length===0&&JSON.stringify(first)===JSON.stringify(last)&&front.endsWith(" Z")&&angled.endsWith(" Z")&&front!==angled});
   }
  }
  await page.reload({waitUntil:"networkidle"});await page.getByLabel("Choose a strand",{exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,fontLoaded:document.fonts.check('16px "Imprint Review Geist"'),targets:[...document.querySelectorAll("button,select,a,summary")].map(n=>({label:n.textContent.trim(),height:n.getBoundingClientRect().height})),localItems:localStorage.length,sessionItems:sessionStorage.length,images:[...document.images].map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0}))}));
  await page.screenshot({path:`outputs/imprint/loops-v2-preview-${width}.png`,fullPage:true});
  if(width===1280)await page.locator(".imprint-loop-grid").screenshot({path:"outputs/imprint/loops-v2-comparison.png"});
  const state=await context.storageState(),noStoredData=measurements.localItems===0&&measurements.sessionItems===0&&state.cookies.length===0;
  const passed=measurements.scrollWidth===width&&measurements.fontLoaded&&measurements.images.length===7&&measurements.images.every(i=>i.loaded)&&measurements.targets.every(t=>t.height>=44)&&threads.passed&&silhouettes.passed&&actions.every(a=>a.passed)&&traces.every(t=>t.passed)&&noStoredData&&errors.length===0&&external.length===0;
  results.push({...measurements,threads,silhouettes,actions,traces,noStoredData,errors,external,passed});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();
 await page.route("**/personal-imprint-loops-v2-inspection.json",route=>route.fulfill({status:503,body:"unavailable"}));await page.goto(origin,{waitUntil:"networkidle"});
 const message=await page.getByRole("status").innerText();results.push({scenario:"missing manifest",message,passed:message.includes("The loop study is not ready")});await context.close();
 const rejected=structuredClone(manifest);rejected.readyForReview=false;rejected.samples[0].status="rejected";delete rejected.samples[0].outputs;
 const rejectedContext=await browser.newContext(),rejectedPage=await rejectedContext.newPage();await rejectedPage.route("**/personal-imprint-loops-v2-inspection.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(rejected)}));
 await rejectedPage.goto(origin,{waitUntil:"networkidle"});await rejectedPage.getByText("This construction needs review before it can be shown.").waitFor();
 results.push({scenario:"rejected variation",passed:await rejectedPage.getByRole("img",{name:"Mira's closed-loop sculpture",exact:true}).count()===0&&await rejectedPage.getByText("Strand inspection will be available after construction checks pass.").count()===1});await rejectedContext.close();
 const unavailableContext=await browser.newContext(),unavailablePage=await unavailableContext.newPage();await unavailablePage.route("**/*-selected-loops.json*",route=>route.fulfill({status:503,body:"unavailable"}));await unavailablePage.goto(origin,{waitUntil:"networkidle"});
 results.push({scenario:"missing strand data",passed:await unavailablePage.getByText("The strand view is unavailable. Refresh to try again.").count()===1});await unavailableContext.close();
 await writeFile("outputs/imprint/loops-v2-preview-review.json",JSON.stringify(results,null,2)+"\n");
 console.log(JSON.stringify(results.map(r=>({width:r.width,scenario:r.scenario,passed:r.passed,actions:r.actions?.length,traces:r.traces?.length,smallTargets:r.targets?.filter(t=>t.height<44),errors:r.errors,external:r.external,noStoredData:r.noStoredData,scrollWidth:r.scrollWidth}))));
 if(results.some(r=>!r.passed))process.exitCode=1;
}finally{await browser?.close();await server.close();}
