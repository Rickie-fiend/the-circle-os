import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { NextRequest } from "next/server.js";
import { quoteCatalog, nextUnreadQuote, rememberQuote } from "../app/os/quotes/quote-model.js";

const quote = (n) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`, text: `Synthetic quote ${n}`, author: "Synthetic author" });
test("quotes complete the whole pool before repeating, including pools over the old Line memory", () => {
  const pool = Array.from({ length: 300 }, (_, n) => quote(n));
  let seen = [];
  for (const item of pool) { const picked = nextUnreadQuote(pool, seen); assert.equal(picked.id, item.id); seen = rememberQuote(pool, seen, picked.id); }
  assert.equal(nextUnreadQuote(pool, seen).id, pool[0].id);
  assert.equal(nextUnreadQuote([], seen), null);
  const added = quote(500); assert.equal(nextUnreadQuote([...pool, added], seen).id, added.id);
  assert.notEqual(nextUnreadQuote(pool.slice(1), seen).id, pool[0].id);
});
test("invalid and duplicate catalog rows fail visibly instead of silently changing authored text", () => {
  assert.throws(() => quoteCatalog([quote(0), quote(0)]));
  assert.throws(() => quoteCatalog([{ ...quote(0), text: " " }]));
  assert.throws(() => quoteCatalog([{ ...quote(0), text: "x".repeat(321) }]));
  assert.equal(quoteCatalog([{ ...quote(0), author: "" }])[0].author, "");
});

function compile(path, replacements = []) {
  let source = readFileSync(new URL(path, import.meta.url), "utf8");
  for (const [from,to] of replacements) source = source.replace(from,to);
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const modelUrl = new URL("../app/os/quotes/quote-model.js", import.meta.url).href;
const serverUrl = compile("../app/os/quotes/quote-server.ts", [["./quote-model.js", modelUrl]]);
const accessUrl = compile("../app/os/admin/admin-access.ts");
const access = await import(accessUrl);
const routeUrl = compile("../app/os/admin/quotes/route.ts", [
  ['import { cookies } from "next/headers";', 'const cookies = async () => ({get: () => globalThis.quoteTestCookie ? {value: globalThis.quoteTestCookie} : undefined});'],
  ["../admin-access", accessUrl], ["../../quotes/quote-server", serverUrl],
]);
const routes = await import(routeUrl);
const originalFetch = globalThis.fetch;
const originals = Object.fromEntries(["CIRCLE_OS_ADMIN_CODE", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"].map(name=>[name,process.env[name]]));
after(() => { globalThis.fetch = originalFetch; delete globalThis.quoteTestCookie; for (const [key,value] of Object.entries(originals)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
function setup() {
  process.env.CIRCLE_OS_ADMIN_CODE = "synthetic-admin-code-for-quotes-tests";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://quotes.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "synthetic-public";
  process.env.SUPABASE_SECRET_KEY = "synthetic-server-secret";
  globalThis.quoteTestCookie = access.adminAccessToken();
}
const request = (method, body = {}, origin = "https://circle.test") => new Request("https://circle.test/os/admin/quotes", { method, headers: { origin, "Content-Type": "application/json" }, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
test("actual quote Admin routes deny absent/forged/expired cookies and cross-origin mutations before contacting the database", async () => {
  setup(); let calls = 0; globalThis.fetch = async () => { calls++; throw new Error("must not contact database"); };
  for (const token of [null, "forged", access.adminAccessToken(undefined, Date.now()-9*60*60*1000)]) {
    globalThis.quoteTestCookie = token;
    assert.equal((await routes.GET(request("GET"))).status, 403);
    assert.equal((await routes.POST(request("POST", quote(0)))).status, 403);
    assert.equal((await routes.DELETE(request("DELETE", {id:quote(0).id}))).status, 403);
  }
  globalThis.quoteTestCookie = access.adminAccessToken();
  assert.equal((await routes.POST(request("POST", quote(0), "https://elsewhere.test"))).status, 403);
  const noOrigin = new Request("https://circle.test/os/admin/quotes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(quote(0)) });
  assert.equal((await routes.POST(noOrigin)).status,403);
  assert.equal(calls, 0);
});
test("actual quote routes use a public key for reads and a server-only key for accepted Admin add/remove", async () => {
  setup(); const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({url,options}); return Response.json([quote(1)]); };
  const read = await routes.GET(request("GET")); assert.equal(read.status,200); assert.deepEqual(await read.json(),[quote(1)]);
  assert.equal(calls.at(-1).options.headers.apikey,"synthetic-public");
  assert.equal((await routes.POST(request("POST", quote(1)))).status,200);
  assert.equal(calls.at(-1).options.headers.apikey,"synthetic-server-secret");
  assert.equal(new URL(calls.at(-1).url).searchParams.has("order"),false,"inserts do not order by an unreturned column");
  assert.equal((await routes.DELETE(request("DELETE", {id:quote(1).id}))).status,200);
  assert.match(calls.at(-1).url,/\?id=eq\.00000000-0000-4000-8000-000000000001$/);
  const before=calls.length;assert.equal((await routes.DELETE(request("DELETE", {id:"bad?or=all"}))).status,400);assert.equal(calls.length,before);
});
test("missing database configuration and database rejection preserve a visible failure", async () => {
  setup(); delete process.env.SUPABASE_SECRET_KEY;
  assert.equal((await routes.POST(request("POST",quote(1)))).status,400);
  process.env.SUPABASE_SECRET_KEY="synthetic-server-secret";
  globalThis.fetch=async()=>Response.json({message:"private backend detail"},{status:500});
  const result=await routes.POST(request("POST",quote(1)));assert.equal(result.status,400);assert.doesNotMatch(JSON.stringify(await result.json()),/private backend detail|synthetic-server-secret/);
});

test("catalog reads follow the server page size until every quote is available", async () => {
  setup();const catalog=Array.from({length:7},(_,n)=>quote(n)),offsets=[];
  globalThis.fetch=async url=>{const offset=Number(new URL(url).searchParams.get("offset"));offsets.push(offset);return Response.json(catalog.slice(offset,offset+3),{headers:{"content-range":`${offset}-${Math.min(offset+2,6)}/7`}});};
  const result=await routes.GET(request("GET"));assert.equal(result.status,200);assert.deepEqual(await result.json(),catalog);assert.deepEqual(offsets,[0,3,6]);
});

test("Next loopback normalization retains same-origin Admin saves without allowing another host or port", async () => {
  setup();let calls=0;globalThis.fetch=async()=>{calls++;return Response.json([quote(4)]);};
  const local=origin=>new NextRequest("http://127.0.0.1:45123/os/admin/quotes",{method:"POST",headers:{Host:"127.0.0.1:45123",Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(quote(4))});
  assert.equal(new URL(local("http://127.0.0.1:45123").url).hostname,"localhost");
  assert.equal((await routes.POST(local("http://127.0.0.1:45123"))).status,200);
  for(const origin of ["http://localhost:45123","http://127.0.0.1:45124","https://elsewhere.test"])assert.equal((await routes.POST(local(origin))).status,403);
  assert.equal(calls,1);
});
