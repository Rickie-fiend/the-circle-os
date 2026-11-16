// Isolated preview rendering/measurement; does not run the paused test suites.
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {startImprintPreview} from "./preview-personal-imprint.mjs";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA||"", "ms-playwright");
const {chromium}=await import("@playwright/test");
const material=process.argv.includes("--material"),prefix=material?"material-v1":"v4",study=material?"?study=material":"?study=geometry";
const materialReport=material?JSON.parse(await readFile("docs/design/personal-imprint-material-v1-inspection.json","utf8")):null;
const server=await startImprintPreview(3028),results=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 await mkdir("outputs/imprint",{recursive:true});
 for(const width of [360,390,416,1280]){const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1}),errors=[];page.on("pageerror",e=>errors.push(e.message));await page.goto(`http://127.0.0.1:3028${study}`,{waitUntil:"networkidle"});await page.waitForSelector(".imprint-master-comparison img");await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`outputs/imprint/${prefix}-preview-${width}.png`,fullPage:true});const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0})),text:document.querySelector("main")?.innerText,font:getComputedStyle(document.querySelector("main")).fontFamily,fontLoaded:document.fonts.check('16px "Imprint Review Geist"')}));let servedHashMatches=true;if(material){const response=await page.request.get(`http://127.0.0.1:3028${measurements.images[0].src}`),servedHash=createHash("sha256").update(await response.body()).digest("hex");servedHashMatches=servedHash===materialReport.renderHash&&measurements.images[0].src.endsWith(materialReport.renderHash);}results.push({...measurements,servedHashMatches,errors});await page.close();}
 if(material){const page=await browser.newPage();await page.route("**/personal-imprint-material-v1-inspection.json",route=>route.fulfill({status:503,body:"unavailable"}));await page.goto("http://127.0.0.1:3028?study=material",{waitUntil:"networkidle"});const failure=await page.locator('[role="status"]').innerText();results.push({scenario:"missing material report",message:failure,passed:failure.includes("Material output is not ready")});await page.close();}
 await writeFile(`outputs/imprint/${prefix}-preview-review.json`,JSON.stringify(results,null,2)+"\n");console.log(JSON.stringify(results));
 if(results.some(r=>r.passed===false||r.width&&(r.scrollWidth>r.width||r.images.some(i=>!i.loaded)||r.errors.length||!r.fontLoaded||!r.servedHashMatches)))process.exitCode=1;
}finally{await browser?.close();await server.close();}
