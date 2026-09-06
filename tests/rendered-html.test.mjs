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
  assert.match(html, /CIRCLE OS/);
  // A server render is a fresh install, so Note greets rather than rotating.
  // "Keep going." is one of the empty-Note words, which is the wrong thing to
  // say to somebody who has not written anything yet.
  assert.match(html, /This is your Note\. Tap here to write\./);
  assert.match(html, /Let&#x27;s set up your first habit\./);
  // The setups that take the whole screen are not server-rendered. A splash is
  // portalled onto the body, which needs a document, so it mounts on the
  // client — and which setup is owed depends on local state the server has no
  // way to know anyway. The feed underneath still renders in full.
  assert.doesNotMatch(html, /os-splash/);
  assert.match(html, /Swipe to begin/);
  assert.doesNotMatch(html, /os-app-dots/);
  assert.match(html, /Today/);
  assert.match(html, /Reflect/);
  assert.doesNotMatch(
    html,
    /Oscar|pond|troph(?:y|ies)|leaderboard|Outside|Focus|Life admin/i,
  );
  assert.doesNotMatch(html, />Mood</);
  assert.doesNotMatch(html, />Morning</);
  assert.doesNotMatch(html, />Midday</);
  assert.doesNotMatch(html, />Afternoon</);
  assert.doesNotMatch(html, />Evening</);
});

test("server-renders first use without asking one careless Vision paragraph", async () => {
  const response = await render("/os/mirror");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Start with you\./);
  assert.match(html, />Name</);
  assert.match(html, />Age</);
  assert.doesNotMatch(html, /Describe your typical Tuesday/);
  assert.doesNotMatch(html, /Describe the life you want\./);
  assert.doesNotMatch(html, />Gender</);
  assert.match(html, /Begin/);
});

test("server-renders the private AI connection route", async () => {
  const response = await render("/os/connect");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Connect Obsidian\./);
  assert.match(html, />Address</);
  assert.doesNotMatch(html, />Key</);
  assert.match(html, /Your profile and days live in your Obsidian vault\./);
});
