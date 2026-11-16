import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { startImprintPreview } from "./preview-personal-imprint.mjs";
import { generatorBase as base, artifactHash as hash } from "./lib/imprint-generator-artifacts.mjs";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
const { chromium } = await import("@playwright/test");
const report = JSON.parse(await readFile(`${base}-inspection.json`, "utf8"));
if (!report.readyForReview) throw new Error("Complete construction inspection before browser review.");
const server = await startImprintPreview(3035), origin = "http://127.0.0.1:3035", url = `${origin}/?study=generator`, results = [];
let browser;
try {
  browser = await chromium.launch({ headless: true });
  await mkdir("outputs/imprint", { recursive: true });
  for (const width of [360, 390, 416, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } }), page = await context.newPage(), errors = [], external = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (!request.url().startsWith(origin) && !request.url().startsWith("data:")) external.push(request.url()); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByLabel("Choose a strand", { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const views = [];
    for (const [mode, label] of [["full", "Thread forms"], ["silhouette", "Silhouettes"], ["depth", "Depth"]]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await page.locator(".imprint-loop-grid img").evaluateAll(nodes => Promise.all(nodes.map(node => node.decode())));
      const images = await page.locator(".imprint-loop-grid img").evaluateAll(nodes => nodes.map(node => node.getAttribute("src")));
      const passed = images.length === 6 && (await Promise.all(images.map(async (src, i) => {
        const expected = report.samples[i].outputs[mode], assetUrl = new URL(src, origin), response = await page.request.get(assetUrl.href);
        return assetUrl.pathname === `/${expected.path}` && assetUrl.searchParams.get("v") === expected.hash && response.ok() && hash(await response.body()) === expected.hash;
      }))).every(Boolean);
      views.push({ mode, passed });
      if (width === 1280) await page.locator(".imprint-loop-grid").screenshot({ path: `outputs/imprint/generator-${mode}-comparison.png` });
    }
    await page.getByRole("button", { name: "Thread forms", exact: true }).click();
    const actions = [], traces = [];
    for (const sample of report.samples) {
      await page.getByLabel("Choose a fictional profile").selectOption(sample.id);
      await page.getByLabel("Choose a strand", { exact: true }).waitFor();
      for (const [label, expected] of [["Repeat answers", "Repeated answers kept the same sculpture."], ["Reorder answers", "Reordered answers kept the same sculpture."], ["Correct profile", "Profile correction kept the original sculpture."], ["Try missing name", "Add a name to make the sample form."]]) {
        const before = await page.locator(".imprint-loop-grid img").evaluateAll(nodes => nodes.map(node => node.getAttribute("src")));
        await page.getByRole("button", { name: label, exact: true }).click();
        await page.getByRole("status").filter({ hasText: expected }).waitFor();
        const after = await page.locator(".imprint-loop-grid img").evaluateAll(nodes => nodes.map(node => node.getAttribute("src")));
        actions.push({ id: sample.id, label, passed: JSON.stringify(before) === JSON.stringify(after) });
      }
      const response = await page.request.get(`${origin}/${sample.outputs.selected.path}`), selected = await response.json();
      for (const index of width === 390 ? [0, 1, 2] : [0]) {
        await page.getByLabel("Choose a strand", { exact: true }).selectOption(String(index));
        await page.getByRole("button", { name: "Front view", exact: true }).click();
        const front = await page.locator(".imprint-loop-trace path").getAttribute("d");
        await page.getByRole("button", { name: "Angled view", exact: true }).click();
        const angled = await page.locator(".imprint-loop-trace path").getAttribute("d");
        const strand = selected[index];
        traces.push({ id: sample.id, index, passed: hash(await response.body()) === sample.outputs.selected.hash && strand.closed && strand.ends.length === 0 && JSON.stringify(strand.route[0]) === JSON.stringify(strand.route.at(-1)) && front.endsWith(" Z") && angled.endsWith(" Z") && front !== angled });
      }
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Choose a strand", { exact: true }).waitFor();
    await page.locator("img").evaluateAll(nodes => Promise.all(nodes.map(node => node.decode())));
    const measurements = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth, font: document.fonts.check('16px "Imprint Review Geist"'),
      storage: localStorage.length + sessionStorage.length,
      targets: [...document.querySelectorAll("button,select,a,summary")].every(node => node.getBoundingClientRect().height >= 44),
      images: [...document.images].every(node => node.complete && node.naturalWidth > 0),
    }));
    const links = [];
    for (const href of await page.locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")))) links.push((await page.request.get(new URL(href, origin).href)).ok());
    await page.screenshot({ path: `outputs/imprint/generator-preview-${width}.png`, fullPage: true });
    results.push({ width, ...measurements, views, actions, traces, errors, external,
      passed: !measurements.overflow && measurements.font && measurements.storage === 0 && measurements.targets && measurements.images && views.every(view => view.passed) && actions.every(action => action.passed) && traces.every(trace => trace.passed) && links.every(Boolean) && !(await context.cookies()).length && errors.length === 0 && external.length === 0 });
    await context.close();
  }
  for (const scenario of ["missing", "incomplete", "rejected", "missing-strand"]) {
    const context = await browser.newContext(), page = await context.newPage();
    if (scenario === "missing-strand") await page.route("**/*-selected-loops.json*", route => route.fulfill({ status: 503, body: "unavailable" }));
    else {
      const fixture = structuredClone(report);
      if (scenario === "incomplete") fixture.readyForReview = false;
      if (scenario === "rejected") { fixture.samples[0].status = "rejected"; delete fixture.samples[0].outputs; }
      await page.route("**/personal-imprint-generator-v1-inspection.json", route => route.fulfill(scenario === "missing" ? { status: 503, body: "unavailable" } : { status: 200, contentType: "application/json", body: JSON.stringify(fixture) }));
    }
    await page.goto(url, { waitUntil: "networkidle" });
    const expected = scenario === "missing" ? "Inspection unavailable. Refresh to try again." : scenario === "incomplete" ? "Construction needs further work before these forms can be shown." : scenario === "rejected" ? "This construction needs review before it can be shown." : "The strand view is unavailable. Refresh to try again.";
    await page.getByText(expected, { exact: true }).waitFor();
    results.push({ scenario, passed: scenario === "missing" || scenario === "incomplete" ? await page.locator("img").count() === 0 : scenario === "rejected" ? await page.getByRole("img", { name: "Mira's rounded sculpture", exact: true }).count() === 0 : await page.locator(".imprint-loop-trace").count() === 0 });
    await context.close();
  }
  await writeFile("outputs/imprint/generator-browser.json", JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results.map(result => ({ width: result.width, scenario: result.scenario, passed: result.passed, errors: result.errors }))));
  if (results.some(result => !result.passed)) process.exitCode = 1;
} finally { await browser?.close(); await server.close(); }
