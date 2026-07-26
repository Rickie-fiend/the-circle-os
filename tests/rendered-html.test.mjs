import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Circle website", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Circle — Mastermind Fight Club<\/title>/i);
  assert.match(html, /An Exclusive Community for Modern Masculine Growth and One Truth\./);
  assert.match(html, /The art of living\./);
  assert.match(html, /Private events like no others\./);
  assert.match(html, /What we stand for\./);
  assert.match(html, /The room is waiting\./);
  assert.match(html, /Membership or Mastermind\?/);
  assert.match(html, /horse-bagpipe-1c4\.notion\.site/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the brand guideline route", async () => {
  const response = await render("/brand");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /The open/);
  assert.match(html, /Growth is not a closed loop\./);
  assert.match(html, /#F1EFE8/);
  assert.match(html, /Cormorant Garamond/);
  assert.match(html, /Space is part of the message\./);
});
