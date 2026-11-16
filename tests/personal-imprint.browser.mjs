import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { startImprintPreview } from "../scripts/preview-personal-imprint.mjs";

test("artwork renders at phone widths, color changes preserve form, profile edits retain image", async () => {
  const server = await startImprintPreview(3025);
  const browser = await chromium.launch({ headless: true });
  try {
    await mkdir("outputs/imprint", { recursive: true });
    for (const width of [360, 390, 416]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("http://127.0.0.1:3025/?study=previous");
      const canvas = page.getByRole("img");
      await canvas.waitFor();
      await page.waitForFunction(() => document.querySelector("canvas")?.width > 0, null, { timeout: 20000 });
      const snapshot = () => canvas.evaluate(c => c.toDataURL());
      const silhouette = () => canvas.evaluate(c => {
        const pixels = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let hash = 2166136261;
        for (let index = 3; index < pixels.length; index += 4) hash = Math.imul(hash ^ pixels[index], 16777619) >>> 0;
        return { width: c.width, height: c.height, alphaHash: hash };
      });
      await page.getByRole("button", { name: "No Orange", exact: true }).click();
      await page.waitForTimeout(150);
      const neutral = await snapshot();
      const geometry = await silhouette();
      await page.getByRole("button", { name: "Chapter complete", exact: true }).click();
      await page.waitForTimeout(150);
      const chapter = await snapshot();
      assert.notEqual(chapter, neutral);
      assert.deepEqual(await silhouette(), geometry);
      await page.getByRole("button", { name: "Complete from Week", exact: true }).click();
      await page.waitForTimeout(150);
      const week = await snapshot();
      assert.deepEqual(await silhouette(), geometry);
      await page.getByRole("button", { name: "Complete from Habits/Tasks", exact: true }).click();
      await page.waitForTimeout(150);
      assert.notEqual(await snapshot(), week);
      assert.deepEqual(await silhouette(), geometry);
      const beforeEdit = await snapshot();
      await page.getByRole("button", { name: "Correct profile, retain form", exact: true }).click();
      assert.equal(await snapshot(), beforeEdit);
      for (let sample = 1; sample <= 3; sample++) {
        await page.getByRole("button", { name: `Shape ${sample}`, exact: true }).click();
        await page.getByRole("button", { name: "Mixed activity", exact: true }).click();
        await page.waitForTimeout(200);
        await canvas.screenshot({ path: `outputs/imprint/shape-${sample}-${width}.png` });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "No Orange", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      assert.notEqual(await snapshot(), beforeEdit);
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
});

test("static vector master loads beside the reference at phone widths and desktop", async () => {
  const server = await startImprintPreview(3025);
  const browser = await chromium.launch({ headless: true });
  try {
    await mkdir("outputs/imprint", { recursive: true });
    for (const width of [360,390,416,1280]) {
      const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2});
      const errors=[];page.on("pageerror",error=>errors.push(error.message));
      await page.goto("http://127.0.0.1:3025");
      const master=page.getByRole("img",{name:"Monochrome vector thread master traced from the reference"});
      const reference=page.getByRole("img",{name:"Original thread artwork reference"});
      for(const art of [master,reference])await art.evaluate(image=>image.decode());
      assert.equal(await page.locator("canvas").count(),0);
      assert.equal(await page.getByRole("button",{name:"Shape 1",exact:true}).count(),0);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await master.screenshot({path:`outputs/imprint/vector-master-${width}.png`});
      if(width===1280)await page.screenshot({path:"outputs/imprint/vector-master-comparison.png",fullPage:true});
      const before=await master.screenshot();
      await page.reload();await master.evaluate(image=>image.decode());
      assert.deepEqual(await master.screenshot(),before);
      assert.deepEqual(errors,[]);
      await page.close();
    }
  } finally {await browser.close();await server.close();}
});
