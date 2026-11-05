import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { build } from "vite";
import { createServer } from "node:http";
import { resolve, extname } from "node:path";
import react from "@vitejs/plugin-react";
import { chromium, expect } from "@playwright/test";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const authURL = "https://circle-auth.test";
const issuer = `${authURL}/auth/v1`;
const origin = "http://127.0.0.1:3221";
const productionOrigin = process.env.CIRCLE_AUTH_PRODUCTION_ORIGIN;
const prefix = "circle-os-auth:circle-auth.test";
const accountA = "10000000-0000-4000-8000-000000000001";
const accountB = "10000000-0000-4000-8000-000000000002";
const harness = `
import React from "react";
import { createRoot } from "react-dom/client";
import { CircleAuthBoundary, SupabaseAuthBoundary } from "/app/os/auth/auth-boundary.tsx";
import { CircleStateProvider, OSFrame, TodayExperience, useCircleState } from "/app/os/circle-os-shell.tsx";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import {PathnameContext} from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import {publishedChapters} from "/app/os/chapters/registry.ts";
import {createChapterRun,chapterRunId} from "/app/os/chapters/chapter-model.js";
import { CircleOSPwa } from "/app/os/pwa-register.tsx";
import "/app/globals.css";
import "/app/os/os-app.css";
function Probe() {
  const model = useCircleState();
  const { ready, today, updateToday } = model;
  window.authModel = model;
  window.completeSetup = () => model.updateState(s => {
    const c = publishedChapters.find(c => c.id === "day-one" && c.version === 3);
    return {...s, chapters:{...s.chapters,runs:{...s.chapters.runs,[chapterRunId(c)]:{
      ...createChapterRun(c),status:"completed",completedAt:new Date().toISOString()}}}};
  });
  if (!ready) return React.createElement("p", null, "Loading local records");
  return React.createElement("main", { "data-testid": "evidence" },
    React.createElement("label", null, "Note", React.createElement("textarea", { "aria-label": "Note", value: today.note || "", onChange(event) { updateToday(day => ({ ...day, note: event.target.value })); } })));
}
const router={push(){},replace(){},prefetch:()=>Promise.resolve()};
const Boundary=location.search.includes("invalid-config")?CircleAuthBoundary:SupabaseAuthBoundary;
createRoot(document.getElementById("root")).render(
  <AppRouterContext.Provider value={router}><PathnameContext.Provider value="/os">
    <Boundary config={{mode:"supabase",url:"${authURL}",key:"synthetic-publishable-key"}}>
      <CircleStateProvider><CircleOSPwa/><OSFrame><Probe/>{location.search.includes("shell")?<TodayExperience/>:null}</OSFrame></CircleStateProvider>
    </Boundary>
  </PathnameContext.Provider></AppRouterContext.Provider>);
`;
let vite, browser, privateKey, jwks;
before(async () => {
  const keys = await generateKeyPair("ES256"); privateKey = keys.privateKey;
  jwks = { keys: [{ ...await exportJWK(keys.publicKey), kid: "synthetic-key", alg: "ES256", use: "sig" }] };
  await mkdir("work/auth-browser", { recursive: true });
  await writeFile("work/auth-browser/entry.tsx", harness);
  await writeFile("work/auth-browser/index.html", '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="./entry.tsx"></script>');
  await build({ configFile: false, publicDir: false, logLevel: "warn", plugins: [react()],
    define: { "process.env": JSON.stringify({ NODE_ENV: "production", NEXT_PUBLIC_CIRCLE_AUTH_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: "invalid-url" }) },
    build: { outDir: "work/auth-browser-dist", emptyOutDir: true, rollupOptions: { input: resolve("work/auth-browser/index.html") } },
  });
  const html = await readFile("work/auth-browser-dist/work/auth-browser/index.html");
  vite = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, origin).pathname);
    if (pathname.startsWith("/os") && pathname !== "/os-sw.js") { response.setHeader("Content-Type", "text/html"); response.end(html); return; }
    const root = resolve(pathname.startsWith("/assets/") ? "work/auth-browser-dist" : "public");
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(`${root}/`) && !path.startsWith(`${root}\\`)) { response.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      response.setHeader("Content-Type", { ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" }[extname(path)] || "application/octet-stream");
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => vite.listen(3221, "127.0.0.1", done)); browser = await chromium.launch();
});
after(async () => { await browser?.close(); if (vite) await new Promise(done => vite.close(done)); });

async function isolated(width, work) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, timezoneId: "Asia/Bangkok" });
  const fixture = { alias: "River", aliasB: "Cloud", aliasFailure: false, confirmed: true, revoked: false, expiredLink: false, passwordRequests: 0, verifyRequests: 0, resetRequests: 0, requests: [], holdUser: null };
  const sessions = new Map();
  const user = id => ({ id, aud: "authenticated", role: "authenticated", email: `${id === accountA ? "a" : "b"}@example.test`,
    email_confirmed_at: fixture.confirmed ? "2026-10-31T00:00:00Z" : null,
    created_at: "2026-10-31T00:00:00Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: { alias: id === accountA ? fixture.alias : fixture.aliasB } });
  async function session(id, expired = false) {
    const now = Math.floor(Date.now() / 1000);
    const access_token = await new SignJWT({ role: "authenticated", session_id: `session-${id}` })
      .setProtectedHeader({ alg: "ES256", kid: "synthetic-key" }).setIssuer(issuer).setSubject(id)
      .setAudience("authenticated").setIssuedAt(now - (expired ? 7200 : 5)).setExpirationTime(now + (expired ? -3600 : 3600)).sign(privateKey);
    sessions.set(access_token, id);
    return { access_token, refresh_token: `refresh-${id}`, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user: user(id) };
  }
  const errors = []; const failed = [];
  context.on("page", page => { page.on("pageerror", error => errors.push(error.message)); page.on("requestfailed", request => failed.push(new URL(request.url()).pathname)); });
  await context.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === origin || url.origin === productionOrigin) return route.continue();
    if (url.origin !== authURL) return route.abort();
    fixture.requests.push(`${request.method()} ${url.pathname}`);
    const send = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "Access-Control-Allow-Origin": request.headers().origin || origin } });
    if (request.method() === "OPTIONS") return send({});
    if (url.pathname.endsWith("/jwks.json")) return send(jwks);
    if (url.pathname.endsWith("/token")) {
      const body = request.postDataJSON();
      if (url.searchParams.get("grant_type") === "password") {
        fixture.passwordRequests++;
        if (body.password !== "synthetic-password") return send({ code: "invalid_credentials", msg: "Invalid login credentials" }, 400);
        if (!fixture.confirmed) return send({ code: "email_not_confirmed", msg: "Email not confirmed" }, 400);
        return send(await session(body.email.startsWith("b") ? accountB : accountA));
      }
      return fixture.revoked ? send({ code: "refresh_token_not_found", msg: "Invalid refresh token" }, 400) : send(await session(accountA));
    }
    if (url.pathname.endsWith("/verify")) {
      fixture.verifyRequests++;
      return fixture.expiredLink ? send({ code: "otp_expired", msg: "Token expired" }, 403) : send(await session(accountA));
    }
    if (url.pathname.endsWith("/recover")) { fixture.resetRequests++; return send({}); }
    if (url.pathname.endsWith("/logout")) return send({});
    if (url.pathname.endsWith("/user")) {
      if (fixture.holdUser) await fixture.holdUser;
      if (fixture.revoked) return send({ code: "session_not_found", msg: "Session revoked" }, 401);
      const id = sessions.get(request.headers().authorization?.replace("Bearer ", ""));
      if (!id) return send({ msg: "Invalid token" }, 401);
      if (request.method() === "PUT") {
        const body = request.postDataJSON();
        if (fixture.aliasFailure) return send({ msg: "Synthetic alias failure" }, 503);
        if (body.data?.alias) { if (id === accountA) fixture.alias = body.data.alias; else fixture.aliasB = body.data.alias; }
      }
      return send(user(id));
    }
    return send({ msg: "Unexpected fixture endpoint" }, 404);
  });
  let page;
  try {
    page = await context.newPage();
    await work({ page, context, fixture, session });
    assert.deepEqual(errors, [], "no browser page errors");
  } catch (error) {
    console.log("Synthetic auth test diagnostics", JSON.stringify({ errors, failed, text: await page?.locator("body").innerText().catch(() => "unavailable"),
      worker: await page?.evaluate(async () => ({ controller: navigator.serviceWorker.controller?.scriptURL, scope: (await navigator.serviceWorker.getRegistration())?.scope,
        caches: await Promise.all((await caches.keys()).map(async name => ({ name, keys: (await (await caches.open(name)).keys()).map(request => request.url) }))) })).catch(() => null) }));
    throw error;
  } finally { await context.close(); }
}
async function open(page, suffix = "") { await page.goto(`${origin}/os${suffix}`); }
async function login(page, email = "a@example.test") {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function ready(page) { await expect(page.getByTestId("evidence")).toBeVisible({ timeout: 20_000 }); }
async function assetsCached(page) {
  await page.waitForFunction(() => document.documentElement.dataset.osOfflineReady === "true");
  await page.waitForFunction(async () => {
    const urls = [...document.querySelectorAll("script[src],link[rel='stylesheet']")].map(element => element.src || element.href);
    return urls.length && (await Promise.all(urls.map(url => caches.match(url)))).every(Boolean);
  });
}
async function logout(page) {
  await page.getByRole("button", { name: "Open account" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
}
for (const width of [390, 360]) {
  test(`account header and greeting use the alias, edit safely and switch accounts at ${width}px`, { timeout: 180_000 }, async () => isolated(width, async ({ page, context, fixture }) => {
    await open(page, "?shell"); await login(page); await ready(page);
    // Sign out remains reachable during unfinished onboarding.
    await expect(page.getByRole("dialog", { name: "Day one", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open account" }).click();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.completeSetup());
    await expect(page.locator(".os-splash")).toHaveCount(0);
    const greeting = page.locator(".os-context-row h1");
    await expect(greeting).toContainText(/Good (morning|afternoon|evening), River\./);
    await expect(page.locator(".os-local-status,.os-auth-bar")).toHaveCount(0);
    const header = page.locator(".os-header"), trigger = header.getByRole("button", { name: "Open account" });
    const dimensions = await trigger.evaluate(el => {
      const b = el.getBoundingClientRect(), h = el.closest("header").getBoundingClientRect();
      return { width:b.width,height:b.height,top:b.top,bottom:b.bottom,headerTop:h.top,headerBottom:h.bottom };
    });
    assert.ok(dimensions.width >= 44 && dimensions.height >= 44);
    assert.ok(dimensions.top >= dimensions.headerTop && dimensions.bottom <= dimensions.headerBottom);
    await trigger.focus(); await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
    await trigger.click(); await greeting.click(); await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click(); await page.getByRole("button", { name:"Edit alias",exact:true }).click();
    await page.getByLabel("Alias", { exact:true }).fill("Not saved");
    await page.getByRole("button", { name:"Cancel",exact:true }).click();
    assert.equal(fixture.alias, "River");
    await trigger.click(); await page.getByRole("button", { name:"Edit alias",exact:true }).click();
    const alias = "မိုး River 🌿";
    await page.getByLabel("Alias", { exact:true }).fill(alias);
    await page.getByRole("button", { name:"Save alias",exact:true }).click();
    await expect(trigger).toHaveText("⋯"); await expect(greeting).toContainText(alias);
    assert.equal(await page.evaluate(() => window.authModel.state.profile.name), "");
    await page.reload(); await ready(page); await expect(greeting).toContainText(alias);
    await trigger.click(); await page.getByRole("button", { name:"Edit alias",exact:true }).click();
    const longAlias = "A".repeat(40);
    await page.getByLabel("Alias", { exact:true }).fill(longAlias);
    await page.getByRole("button", { name:"Save alias",exact:true }).click();
    await expect(trigger).toHaveText("⋯"); await expect(greeting).toContainText(longAlias);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await greeting.evaluate(el => el.scrollWidth <= el.clientWidth), "long alias wraps without clipping");
    await trigger.click();
    await page.evaluate(() => document.fonts.ready);
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId:root.nodeId, selector:".os-header .os-account-menu > button" });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    console.log("Account menu rendered fonts",width,JSON.stringify(fonts));
    assert.ok(fonts.some(font => font.isCustomFont && font.familyName === "Geist"), "menu renders the actual Geist brand font");
    assert.equal(await page.getByRole("button", { name:"Edit alias",exact:true }).evaluate(el => getComputedStyle(el).fontWeight), "650");
    await cdp.detach();
    const menu = await page.getByRole("group", { name:"Account",exact:true }).boundingBox();
    assert.ok(menu.width < 192, "action menu fits its labels instead of a fixed width");
    const spacing = await page.getByRole("button", { name:"Edit alias",exact:true }).evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const text = range.getBoundingClientRect(), menu = el.parentElement.getBoundingClientRect();
      return { left:text.left-menu.left, right:menu.right-text.right, width:menu.width, height:el.getBoundingClientRect().height };
    });
    assert.ok(Math.abs(spacing.left-spacing.right) <= 1, "text has equal space on each side");
    assert.ok(spacing.height >= 44, "compact menu keeps its touch target");
    console.log("Account menu spacing",width,JSON.stringify(spacing));
    assert.ok(menu.x >= 0 && menu.x + menu.width <= width);
    await page.screenshot({ path:`work/account-menu-${width}.png` });
    await page.getByRole("button", { name:"Sign out",exact:true }).click();
    await login(page,"b@example.test"); await ready(page); await page.evaluate(() => window.completeSetup());
    await expect(greeting).toContainText("Cloud"); await expect(greeting).not.toContainText(longAlias);
    await expect(trigger).toHaveText("⋯"); await expect(trigger).toHaveAttribute("aria-expanded","false");
    await logout(page); await login(page); await ready(page); await expect(greeting).toContainText(longAlias);
  }));

  test(`real client: login, reload, logout, A/B isolation and preserved legacy records at ${width}px`, { timeout: 120_000 }, async () => isolated(width, async ({ page, fixture }) => {
    await open(page); await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "auth has no horizontal overflow");
    await page.screenshot({ path: `work/auth-login-${width}.png` });
    await page.evaluate(() => localStorage.setItem("circle-os-state-v2", "synthetic legacy bytes"));
    await login(page); await ready(page);
    await page.getByLabel("Note", { exact: true }).fill("A's saved note");
    await expect.poll(() => page.evaluate(id => localStorage.getItem(`circle-os-state-v2:account:${id}`), accountA)).toContain("A's saved note");
    await page.reload(); await ready(page); await expect(page.getByLabel("Note", { exact: true })).toHaveValue("A's saved note");
    await logout(page); assert.equal(await page.getByTestId("evidence").count(), 0);
    await login(page, "b@example.test"); await ready(page); await expect(page.getByLabel("Note", { exact: true })).toHaveValue("");
    await page.getByLabel("Note", { exact: true }).fill("B's saved note");
    await logout(page); await login(page); await ready(page);
    await expect(page.getByLabel("Note", { exact: true })).toHaveValue("A's saved note");
    assert.equal(await page.evaluate(() => localStorage.getItem("circle-os-state-v2")), "synthetic legacy bytes");
    assert.ok(fixture.passwordRequests >= 3);
    const box = await page.getByRole("button", { name: "Open account" }).boundingBox(); assert.ok(box.height >= 44);
  }));
  test(`real client: offline reload with expired signed proof, local save and offline logout at ${width}px`, { timeout: 120_000 }, async () => isolated(width, async ({ page, context, session }) => {
    await open(page); await login(page); await ready(page);
    await page.getByLabel("Note", { exact: true }).fill("Saved before flight");
    await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await assetsCached(page);
    const expired = await session(accountA, true);
    await page.evaluate(({ prefix, token }) => { const key = `${prefix}:offline`; const proof = JSON.parse(localStorage.getItem(key)); proof.token = token; localStorage.setItem(key, JSON.stringify(proof)); }, { prefix, token: expired.access_token });
    await context.setOffline(true); await page.reload(); await ready(page);
    await expect(page.getByLabel("Note", { exact: true })).toHaveValue("Saved before flight");
    await page.getByLabel("Note", { exact: true }).fill("Written on the flight");
    await page.reload(); await ready(page); await expect(page.getByLabel("Note", { exact: true })).toHaveValue("Written on the flight");
    await logout(page); await page.reload(); await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    assert.equal(await page.getByTestId("evidence").count(), 0);
  }));
}

test("edited alias survives offline reload; a failed offline edit keeps the existing alias", { timeout: 180_000 }, async () => isolated(360, async ({ page, context }) => {
  await open(page,"?shell"); await login(page); await ready(page); await page.evaluate(() => window.completeSetup());
  await expect(page.locator(".os-splash")).toHaveCount(0);
  const trigger = page.getByRole("button", {name:"Open account"});
  await trigger.click(); await page.getByRole("button",{name:"Edit alias",exact:true}).click();
  await page.getByLabel("Alias",{exact:true}).fill("Moon");
  await page.getByRole("button",{name:"Save alias",exact:true}).click();
  await expect(page.locator(".os-context-row h1")).toContainText("Moon");
  await assetsCached(page); await context.setOffline(true); await page.reload(); await ready(page);
  await expect(page.locator(".os-context-row h1")).toContainText("Moon"); await expect(trigger).toHaveText("⋯");
  await trigger.click(); await page.getByRole("button",{name:"Edit alias",exact:true}).click();
  await page.getByLabel("Alias",{exact:true}).fill("Unsaved offline alias");
  await page.getByRole("button",{name:"Save alias",exact:true}).click();
  await expect(page.getByRole("group",{name:"Account",exact:true}).getByRole("status")).toContainText("Connect to the internet");
  await expect(trigger).toHaveText("⋯"); await expect(page.locator(".os-context-row h1")).toContainText("Moon");
  await page.getByRole("button",{name:"Cancel",exact:true}).click(); await logout(page);
  await expect(page.getByRole("heading",{name:"Welcome back."})).toBeVisible();
}));
test("forged marker and forged proof do not open another account; logout closes another tab", { timeout: 120_000 }, async () => isolated(390, async ({ page, context }) => {
  await open(page); await login(page); await ready(page);
  const second = await context.newPage(); await open(second); await ready(second);
  await logout(page); await expect(second.getByTestId("evidence")).toHaveCount(0);
  await page.evaluate(id => localStorage.setItem("circle-os-account-scope-v1", JSON.stringify({ kind: "account", accountId: id, epoch: "forged" })), accountB);
  await page.reload(); await expect(page.getByTestId("evidence")).toHaveCount(0);
  await login(page); await ready(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await assetsCached(page);
  await page.evaluate(id => { localStorage.setItem("circle-os-account-scope-v1", JSON.stringify({ kind: "account", accountId: id, epoch: "forged" })); dispatchEvent(new StorageEvent("storage", { key: "circle-os-account-scope-v1" })); }, accountB);
  await expect(page.getByTestId("evidence")).toHaveCount(0);
  await context.setOffline(true); await page.reload(); await ready(page);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("circle-os-account-scope-v1")).accountId), accountA);
  await page.evaluate(prefix => { const key = `${prefix}:offline`; const proof = JSON.parse(localStorage.getItem(key)); proof.accountId = "forged"; localStorage.setItem(key, JSON.stringify(proof)); }, prefix);
  await page.reload(); await expect(page.getByTestId("evidence")).toHaveCount(0);
}));
test("invite link is scrubbed, password and alias are required, and reload resumes password entry", { timeout: 120_000 }, async () => isolated(360, async ({ page, fixture }) => {
  fixture.alias = "";
  await open(page, "/auth/confirm#token_hash=synthetic-invite&type=invite");
  await expect(page.getByRole("heading", { name: "Set your password." })).toBeVisible();
  assert.equal(new URL(page.url()).hash, ""); assert.equal(await page.getByTestId("evidence").count(), 0);
  await page.reload(); await expect(page.getByRole("heading", { name: "Set your password." })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("synthetic-password");
  await page.getByLabel("Repeat password").fill("synthetic-password");
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByRole("heading", { name: "What shall we call you?" })).toBeVisible();
  assert.equal(await page.getByTestId("evidence").count(), 0);
  await page.getByLabel("Alias", { exact: true }).fill("Moon"); await page.getByRole("button", { name: "Continue", exact: true }).click();
  await ready(page); await expect(page.getByRole("button", { name: "Open account" })).toHaveText("⋯");
  assert.equal(fixture.alias, "Moon");
  assert.equal(fixture.verifyRequests, 1);
}));
test("wrong password, unverified email, reset request, and expired recovery link stay locked", { timeout: 120_000 }, async () => isolated(390, async ({ page, fixture }) => {
  await open(page);
  await page.getByLabel("Email", { exact: true }).fill("a@example.test"); await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click(); await expect(page.getByRole("status")).toContainText("did not work");
  fixture.confirmed = false; await login(page); await expect(page.getByRole("status")).toContainText("Verify your email");
  assert.equal(await page.getByTestId("evidence").count(), 0);
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("a@example.test"); await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If this email has an account"); assert.equal(fixture.resetRequests, 1);
  fixture.expiredLink = true; await open(page, "/auth/confirm#token_hash=used&type=recovery");
  await expect(page.getByRole("status")).toContainText("expired"); assert.equal(await page.getByTestId("evidence").count(), 0);
}));
test("successful password recovery returns to the same owner and reconnect detects revocation", { timeout: 120_000 }, async () => isolated(390, async ({ page, context, fixture }) => {
  await open(page); await login(page); await ready(page); await page.getByLabel("Note", { exact: true }).fill("Original evidence");
  await open(page, "/auth/confirm#token_hash=synthetic-recovery&type=recovery");
  await expect(page.getByRole("heading", { name: "Set your password." })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("synthetic-password"); await page.getByLabel("Repeat password").fill("synthetic-password");
  await page.getByRole("button", { name: "Save password" }).click(); await ready(page);
  await expect(page.getByLabel("Note", { exact: true })).toHaveValue("Original evidence");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await assetsCached(page);
  await context.setOffline(true); await page.reload(); await ready(page);
  fixture.revoked = true; await context.setOffline(false);
  await expect(page.getByTestId("evidence")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
}));
test("cross-tab logout wins over a delayed real-client session check", { timeout: 120_000 }, async () => isolated(390, async ({ page, context, fixture }) => {
  await open(page); await login(page); await ready(page);
  const second = await context.newPage(); await open(second); await ready(second);
  let release;
  fixture.holdUser = new Promise(done => { release = done; });
  await page.reload(); await expect(page.getByRole("heading", { name: "Opening Circle OS…" })).toBeVisible();
  await logout(second); release(); fixture.holdUser = null;
  await expect(page.getByTestId("evidence")).toHaveCount(0);
  await page.reload(); await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  assert.equal(await page.evaluate(prefix => localStorage.getItem(`${prefix}:offline`), prefix), null);
}));
test("missing or invalid project configuration never falls back to legacy records", { timeout: 120_000 }, async () => isolated(360, async ({ page }) => {
  await open(page, "?invalid-config");
  await expect(page.getByRole("heading", { name: "Sign-in is not ready." })).toBeVisible();
  assert.equal(await page.getByTestId("evidence").count(), 0);
  assert.equal(await page.getByRole("button", { name: "Sign in", exact: true }).count(), 0);
}));
for (const width of [390, 360]) {
  test(`production app: verified account opens Day One without name/age and returns offline at ${width}px`, { timeout: 120_000, skip: !productionOrigin }, async () => isolated(width, async ({ page, context }) => {
    await page.goto(`${productionOrigin}/os`);
    await login(page);
    await expect(page.getByRole("heading", { name: "Start with what matters." })).toBeVisible({ timeout: 20_000 });
    assert.equal(new URL(page.url()).pathname, "/os");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await assetsCached(page);
    await context.setOffline(true); await page.reload();
    await expect(page.getByRole("heading", { name: "Start with what matters." })).toBeVisible({ timeout: 20_000 });
    await logout(page); await page.reload();
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    await page.screenshot({ path: `work/auth-production-logout-${width}.png` });
  }));
}
