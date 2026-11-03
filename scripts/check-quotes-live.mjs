// Runs only against the configured public quote catalog. Never prints credentials.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { addQuote, readQuotes, removeQuote } from "../app/os/quotes/quote-server.ts";

async function checkAppRoutes() {
  const [{ default: next }, { createServer }, access] = await Promise.all([
    import("next"), import("node:http"), import("../app/os/admin/admin-access.ts"),
  ]);
  let app, server, handle;
  const text = `Temporary quote app-route check ${randomUUID()}`;
  try {
    server = createServer(async (request, response) => {
      if (!handle) { response.writeHead(503).end(); return; }
      await handle(request, response);
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    // Next needs the actual host/port to construct a request URL for origin checks.
    app = next({ dev: false, dir: process.cwd(), hostname: "127.0.0.1", port: server.address().port });
    await app.prepare();
    handle = app.getRequestHandler();
    const cookie = `${access.ADMIN_COOKIE}=${access.adminAccessToken()}`;
    const request = (method, value, authCookie = cookie, requestOrigin = origin) => fetch(`${origin}/os/admin/quotes`, {
      method, headers: { Cookie: authCookie, Origin: requestOrigin, "Content-Type": "application/json" },
      ...(value ? { body: JSON.stringify(value) } : {}),
    });
    assert.equal((await fetch(`${origin}/os/quotes`)).status, 200);
    assert.equal((await request("POST", { text }, "")).status, 403);
    assert.equal((await request("POST", { text }, `${access.ADMIN_COOKIE}=forged`)).status, 403);
    assert.equal((await request("POST", { text }, cookie, "https://elsewhere.test")).status, 403);
    assert.equal((await request("GET")).status, 200, "The app must recognize the signed Admin cookie.");
    const added = await request("POST", { text, author: "Verification" });
    if (added.status !== 200) {
      const failure = await added.json();
      throw new Error(`App quote add failed (${added.status}): ${failure.error || "Unknown error"}`);
    }
    const [quote] = await added.json();
    assert.equal(quote.text, text);
    const read = await request("GET");
    assert.ok((await read.json()).some(item => item.id === quote.id));
    const removed = await request("DELETE", { id: quote.id });
    assert.equal(removed.status, 200);
    console.log(JSON.stringify({ appPublicRead: true, appUnauthorizedDenied: true, appCrossOriginDenied: true, appAdminAdd: true, appAdminRead: true, appAdminRemove: true }));
  } finally {
    // Also clean up an accepted write whose HTTP receipt was interrupted.
    try {
      const url = new URL(`/rest/v1/circle_quotes?text=eq.${encodeURIComponent(text)}`, process.env.NEXT_PUBLIC_SUPABASE_URL);
      const response = await fetch(url, { method: "DELETE", headers: { apikey: process.env.SUPABASE_SECRET_KEY }, signal: AbortSignal.timeout(10000) });
      assert.ok(response.ok, "App-route fixture cleanup must succeed.");
      assert.equal((await readQuotes()).some(item => item.text === text), false);
      console.log(JSON.stringify({ appTemporaryQuotesRemaining: 0 }));
    } finally {
      if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
      await app?.close();
    }
  }
}

try {
  process.loadEnvFile(".env.local");
  const pool = await readQuotes();
  console.log(JSON.stringify({ tableReadable: true, quotes: pool.length, writeKeyConfigured: Boolean(process.env.SUPABASE_SECRET_KEY) }));
  if (process.argv.includes("--app")) {
    assert.ok(process.env.SUPABASE_SECRET_KEY, "Server quote key is not configured.");
    await checkAppRoutes();
  } else if (process.argv.includes("--write")) {
    assert.ok(process.env.SUPABASE_SECRET_KEY, "Server quote key is not configured.");
    const url = new URL("/rest/v1/circle_quotes", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const ids = [randomUUID(), randomUUID()];
    const temporaryText = `Temporary Circle OS quote access check ${randomUUID()}`;
    const request = (method, key, suffix = "", body) => fetch(`${url}${suffix}`, {
      method, headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=representation" },
      signal: AbortSignal.timeout(10000), ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const secret = process.env.SUPABASE_SECRET_KEY, publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    try {
      const [added] = await addQuote({ text: temporaryText, author: "Verification" });
      ids[0] = added.id;
      const read = await request("GET", publicKey, `?id=eq.${ids[0]}&select=id`);
      assert.deepEqual(await read.json(), [{ id: ids[0] }]);
      const addDenied = await request("POST", publicKey, "", { id: ids[1], text: "Temporary access-denial check.", author: "Verification" });
      assert.ok([401,403].includes(addDenied.status), "Public quote creation must be denied.");
      const deleteDenied = await request("DELETE", publicKey, `?id=eq.${ids[0]}`);
      assert.ok([401,403].includes(deleteDenied.status), "Public quote deletion must be denied.");
      assert.ok((await removeQuote(ids[0])).some(item => item.id === ids[0]), "The server module must remove its quote.");
      console.log(JSON.stringify({ serverAdd: true, publicRead: true, publicAddDenied: true, publicDeleteDenied: true }));
    } finally {
      const removed = await request("DELETE", secret, `?id=in.(${ids.join(",")})`);
      const interrupted = await request("DELETE", secret, `?text=eq.${encodeURIComponent(temporaryText)}`);
      if (!removed.ok || !interrupted.ok) { console.log(JSON.stringify({ cleanupFailed: true, temporaryIds: ids })); throw new Error("Temporary quote cleanup failed."); }
      const check = await request("GET", publicKey, `?id=in.(${ids.join(",")})&select=id`);
      assert.deepEqual(await check.json(), []);
      console.log(JSON.stringify({ serverRemove: true, temporaryQuotesRemaining: 0 }));
    }
  }
} catch (error) {
  console.log(JSON.stringify({ passed: false, error: error.message, code: error.cause?.code || error.code || undefined }));
  process.exitCode = 1;
}
