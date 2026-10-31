import assert from "node:assert/strict";
import test from "node:test";

async function fixture() {
  const data = new Map();
  const events = new EventTarget();
  const previous = globalThis.window;
  globalThis.window = {
    addEventListener: events.addEventListener.bind(events),
    localStorage: {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
    },
  };
  const scope = await import(`../app/os/account-scope.js?case=${crypto.randomUUID()}`);
  return { ...scope, data, events, restore() {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  } };
}

test("development test selection preserves the real marker and invalidates previous work", async () => {
  const previousEnvironment = process.env.NODE_ENV; process.env.NODE_ENV = "development";
  const f = await fixture();
  try {
    const real = f.activateAccountScope("real-account");
    const original = f.data.get(f.ACCOUNT_SCOPE_STORAGE_KEY);
    f.enableDevelopmentTestScope();
    assert.equal(real.signal.aborted, true);
    assert.equal(f.getAccountScope().kind, "signed-out");
    f.activateAccountScope("dev-test-synthetic");
    assert.equal(f.data.get(f.ACCOUNT_SCOPE_STORAGE_KEY), original);
    assert.equal(JSON.parse(f.data.get(f.DEVELOPMENT_TEST_SCOPE_STORAGE_KEY)).accountId, "dev-test-synthetic");
  } finally { f.restore(); if (previousEnvironment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnvironment; }
});

test("production cannot enable the development storage namespace", async () => {
  const previousEnvironment = process.env.NODE_ENV; process.env.NODE_ENV = "production";
  const f = await fixture();
  try {
    const legacy = f.getAccountScope();
    assert.throws(() => f.enableDevelopmentTestScope(), /only available in development/);
    assert.equal(f.getAccountScope(), legacy);
    assert.equal(f.data.has(f.DEVELOPMENT_TEST_SCOPE_STORAGE_KEY), false);
  } finally { f.restore(); if (previousEnvironment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnvironment; }
});

test("legacy keys stay unchanged; account entry never claims old records", async () => {
  const f = await fixture();
  try {
    f.data.set("circle-os-state-v2", "synthetic legacy bytes");
    const legacy = f.getAccountScope();
    assert.equal(f.accountStorageKey(legacy, "circle-os-state-v2"), "circle-os-state-v2");
    const a = f.activateAccountScope("synthetic-a");
    assert.equal(f.accountStorageKey(a, "circle-os-state-v2"), "circle-os-state-v2:account:synthetic-a");
    assert.equal(f.data.get("circle-os-state-v2"), "synthetic legacy bytes");
    assert.equal(f.data.has("circle-os-state-v2:account:synthetic-a"), false);
    assert.throws(() => f.assertAccountScope(legacy), f.AccountScopeChangedError);
    assert.throws(() => f.assertAccountScope({ ...a }), f.AccountScopeChangedError);
  } finally { f.restore(); }
});

test("A to B to A closes all earlier work, even for the same account", async () => {
  const f = await fixture();
  try {
    const a = f.activateAccountScope("synthetic-a");
    const b = f.activateAccountScope("synthetic-b");
    const nextA = f.activateAccountScope("synthetic-a");
    assert.equal(a.signal.aborted, true);
    assert.equal(b.signal.aborted, true);
    assert.notEqual(a.epoch, nextA.epoch);
    assert.throws(() => f.accountStorageKey(a, "state"), f.AccountScopeChangedError);
    assert.equal(f.isAccountScopeCurrent(nextA), true);
  } finally { f.restore(); }
});

test("signed-out, corrupt and removed markers never grant legacy access", async () => {
  const f = await fixture();
  try {
    const a = f.activateAccountScope("synthetic-a");
    const signedOut = f.activateAccountScope(null);
    assert.equal(a.signal.aborted, true);
    assert.throws(() => f.accountStorageKey(signedOut, "state"), f.AccountScopeChangedError);
    f.data.set(f.ACCOUNT_SCOPE_STORAGE_KEY, "broken JSON");
    assert.equal(f.getAccountScope().kind, "signed-out");
    f.data.delete(f.ACCOUNT_SCOPE_STORAGE_KEY);
    assert.equal(f.getAccountScope().kind, "signed-out");
  } finally { f.restore(); }
});

test("cross-tab change aborts scope and notifies readers; stale access is denied before its event", async () => {
  const f = await fixture();
  try {
    const a = f.activateAccountScope("synthetic-a");
    let notifications = 0;
    const unsubscribe = f.subscribeAccountScope(() => notifications++);
    f.data.set(f.ACCOUNT_SCOPE_STORAGE_KEY, JSON.stringify({ kind: "account", accountId: "synthetic-b", epoch: "other-tab" }));
    assert.throws(() => f.assertAccountScope(a), f.AccountScopeChangedError);
    const event = new Event("storage");
    event.key = f.ACCOUNT_SCOPE_STORAGE_KEY;
    f.events.dispatchEvent(event);
    assert.equal(notifications, 1);
    assert.equal(f.getAccountScope().accountId, "synthetic-b");
    unsubscribe();
    f.activateAccountScope(null);
    assert.equal(notifications, 1);
  } finally { f.restore(); }
});

test("invalid IDs cannot choose storage paths and unreadable markers close access", async () => {
  const f = await fixture();
  try {
    for (const id of ["", "../owner", "a:b", "x".repeat(129)]) {
      assert.throws(() => f.activateAccountScope(id), /Invalid account ID/);
    }
    const a = f.activateAccountScope("synthetic-a");
    window.localStorage.getItem = () => { throw new Error("unavailable"); };
    assert.equal(f.getAccountScope().kind, "signed-out");
    assert.equal(a.signal.aborted, true);
  } finally { f.restore(); }
});

test("a failed logout marker write closes this tab until a successful activation", async () => {
  const f = await fixture();
  try {
    const a = f.activateAccountScope("synthetic-a");
    const write = window.localStorage.setItem;
    window.localStorage.setItem = () => { throw new Error("quota"); };
    assert.throws(() => f.activateAccountScope(null), /quota/);
    assert.equal(a.signal.aborted, true);
    assert.equal(f.getAccountScope().kind, "signed-out");
    assert.equal(f.getAccountScope().kind, "signed-out");
    window.localStorage.setItem = write;
    assert.equal(f.activateAccountScope("synthetic-b").accountId, "synthetic-b");
  } finally { f.restore(); }
});
