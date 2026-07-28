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
  assert.match(html, /The human/);
  assert.match(html, /One whole\. Never perfect\./);
  assert.match(html, /#F1EFE8/);
  assert.match(html, /#191813/);
  assert.match(html, /#E36B37/);
  assert.match(html, /Cormorant Garamond/);
  assert.match(html, /Space is part of the message\./);
});

test("server-renders the functional Circle OS Today route", async () => {
  const response = await render("/os");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /THE CIRCLE OS/);
  assert.match(html, /How.{0,10}your energy\?/);
  assert.match(html, /Put the book where you will see it tonight\./);
  assert.match(html, /Mission/);
  assert.match(html, /Your day, hour by hour/);
  assert.match(html, /Add main activity/);
  assert.match(html, /Today/);
  assert.match(html, /Vision/);
  assert.doesNotMatch(html, /Oscar|pond|troph(?:y|ies)|leaderboard/i);
});

test("server-renders the complete Circle OS Vision route", async () => {
  const response = await render("/os/mirror");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Your life in view/);
  assert.match(html, /Pattern/);
  assert.match(html, /Data coverage/);
  assert.match(html, /Where it went/);
  assert.match(html, /Your rhythm/);
  assert.match(html, /Mood field/);
  assert.match(html, /Becoming/);
  assert.match(html, /There is not enough evidence to say\./);
});
