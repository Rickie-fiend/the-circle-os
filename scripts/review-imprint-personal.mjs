// Isolated UI verification for the approved personal-form prototype.
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {startImprintPreview} from "./preview-personal-imprint.mjs";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA||"","ms-playwright");
const {chromium}=await import("@playwright/test"),manifest=JSON.parse(await readFile("docs/design/personal-imprint-personal-v1-inspection.json","utf8")),server=await startImprintPreview(3030),results=[];
const hash=v=>createHash("sha256").update(v).digest("hex");
let browser;
try{
 browser=await chromium.launch({headless:true});await mkdir("outputs/imprint",{recursive:true});
 const images=new Map([[manifest.baseline.path,manifest.baseline.hash],...manifest.samples.map(s=>[s.outputs.full.path,s.renderHash])]);
 for(const width of [360,390,416,1280]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1}),page=await context.newPage(),errors=[],external=[];
  page.on("pageerror",error=>errors.push(error.message));page.on("request",request=>{if(!request.url().startsWith("http://127.0.0.1:3030")&&!request.url().startsWith("data:"))external.push(request.url());});
  await page.goto("http://127.0.0.1:3030/?study=personal",{waitUntil:"networkidle"});await page.locator(".imprint-personal-grid img").last().waitFor();await page.evaluate(()=>document.fonts.ready);
  const actions=[];
  for(const sample of manifest.samples){
   await page.getByLabel("Check a sample").selectOption(sample.id);
   for(const[label,expected]of [["Repeat answers","Repeated answers kept the same form."],["Reorder selections","Reordered selections kept the same form."],["Correct profile","Profile correction kept the original form."],["Try missing name","Add a name to make the sample form."]]){
    const before=await page.locator(".imprint-personal-grid img").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("src")));
    await page.getByRole("button",{name:label,exact:true}).click();await page.getByRole("status").filter({hasText:expected}).waitFor();
    const after=await page.locator(".imprint-personal-grid img").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("src")));
    actions.push({sample:sample.id,action:label,passed:JSON.stringify(before)===JSON.stringify(after),message:await page.getByRole("status").innerText()});
   }
  }
  await page.reload({waitUntil:"networkidle"});await page.locator(".imprint-personal-grid img").last().waitFor();await page.evaluate(()=>document.fonts.ready);
  const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0})),fontLoaded:document.fonts.check('16px "Imprint Review Geist"'),targets:[...document.querySelectorAll("button,select,a")].map(n=>({label:n.textContent.trim(),height:n.getBoundingClientRect().height})),localItems:localStorage.length,sessionItems:sessionStorage.length,text:document.querySelector("main").innerText}));
  const served=[];for(const image of measurements.images){const parsed=new URL(image.src,"http://127.0.0.1:3030"),expected=images.get(parsed.pathname.slice(1)),response=await page.request.get(parsed.href);served.push({src:image.src,passed:expected===hash(await response.body())&&parsed.searchParams.get("v")===expected});}
  await page.screenshot({path:`outputs/imprint/personal-v1-preview-${width}.png`,fullPage:true});
  if(width===1280)await page.locator(".imprint-personal-grid").screenshot({path:"outputs/imprint/personal-v1-comparison.png"});
  const state=await context.storageState(),noStoredData=measurements.localItems===0&&measurements.sessionItems===0&&state.cookies.length===0;
  const passed=measurements.scrollWidth===width&&measurements.images.length===4&&measurements.images.every(i=>i.loaded)&&measurements.fontLoaded&&measurements.targets.every(t=>t.height>=44)&&actions.every(a=>a.passed)&&served.every(s=>s.passed)&&errors.length===0&&external.length===0&&noStoredData;
  results.push({...measurements,actions,served,noStoredData,errors,external,passed});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();await page.route("**/personal-imprint-personal-v1-inspection.json",route=>route.fulfill({status:503,body:"unavailable"}));await page.goto("http://127.0.0.1:3030/?study=personal",{waitUntil:"networkidle"});const message=await page.getByRole("status").innerText();results.push({scenario:"missing manifest",message,passed:message.includes("The personal-form study is not ready")});await context.close();
 const rejected=structuredClone(manifest);rejected.status="rejected";rejected.readyForReview=false;rejected.samples[0].status="rejected";delete rejected.samples[0].outputs;
 const rejectedContext=await browser.newContext(),rejectedPage=await rejectedContext.newPage();
 await rejectedPage.route("**/personal-imprint-personal-v1-inspection.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(rejected)}));
 await rejectedPage.goto("http://127.0.0.1:3030/?study=personal",{waitUntil:"networkidle"});
 const rejectedMessage=await rejectedPage.getByText("This variation is not ready. Its geometry needs review.").innerText(),rejectedImageCount=await rejectedPage.getByRole("img",{name:"Mira's fictional personal form",exact:true}).count();
 results.push({scenario:"rejected variation",message:rejectedMessage,passed:rejectedImageCount===0});await rejectedContext.close();
 await writeFile("outputs/imprint/personal-v1-preview-review.json",JSON.stringify(results,null,2)+"\n");
 console.log(JSON.stringify(results.map(r=>({width:r.width,scenario:r.scenario,passed:r.passed,actions:r.actions?.length,errors:r.errors,external:r.external,noStoredData:r.noStoredData,scrollWidth:r.scrollWidth}))));
 if(results.some(r=>!r.passed))process.exitCode=1;
}finally{await browser?.close();await server.close();}
