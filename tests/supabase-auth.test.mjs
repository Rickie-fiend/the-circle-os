import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { verifyOfflineProof } from "../app/os/auth/offline-proof.js";
import { createAuthController } from "../app/os/auth/auth-controller.js";

function fixture() {
  let owner = null;
  let forgotten = 0;
  const adapter = {
    openScope(id) { owner = id; }, closeScope() { owner = null; },
    forget() { forgotten++; }, cancelPending() {}, message(error) { return error.message; },
    async restore() { return { id: "a", alias: "A" }; },
    async signIn() { return { id: "b", alias: "B" }; },
    async consumeLink() {}, async setPassword() { return { id: "a", alias: "" }; },
    async setAlias(alias) { return { id: "a", alias }; }, async signOut() {},
  };
  return { adapter, owner: () => owner, forgotten: () => forgotten };
}
const pending = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test("verified restore selects the owner; a marker is never an input to authentication", async () => {
  const f = fixture(); const controller = createAuthController(f.adapter);
  assert.equal(controller.getSnapshot().phase, "checking");
  assert.equal(f.owner(), null);
  await controller.restore();
  assert.equal(f.owner(), "a"); assert.equal(controller.getSnapshot().phase, "ready");
});
test("logout immediately closes access and late restore cannot reopen it", async () => {
  const f = fixture(); const delayed = pending(); f.adapter.restore = () => delayed.promise;
  const controller = createAuthController(f.adapter); const restoring = controller.restore();
  const logout = controller.signOut();
  assert.equal(f.owner(), null); assert.equal(f.forgotten(), 1);
  delayed.resolve({ id: "a", alias: "A" }); await restoring; await logout;
  assert.equal(f.owner(), null); assert.equal(controller.getSnapshot().phase, "signed-out");
});
test("a newer login wins over a delayed response from a previous account", async () => {
  const f = fixture(); const delayed = pending(); f.adapter.restore = () => delayed.promise;
  const controller = createAuthController(f.adapter); const restoring = controller.restore();
  await controller.signIn("b@example.test", "synthetic");
  delayed.resolve({ id: "a", alias: "A" }); await restoring;
  assert.equal(f.owner(), "b"); assert.equal(controller.getSnapshot().accountId, "b");
});
test("invitation and recovery sessions stop at password, including restore; alias stays separate", async () => {
  const f = fixture(); f.adapter.restore = async () => ({ id: "a", alias: "", passwordRequired: true });
  const controller = createAuthController(f.adapter);
  await controller.restore(); assert.equal(controller.getSnapshot().phase, "password"); assert.equal(f.owner(), null);
  await controller.consumeLink({ type: "invite", token_hash: "synthetic" });
  assert.equal(f.owner(), null); assert.equal(controller.getSnapshot().phase, "password");
  await controller.setPassword("synthetic-password"); assert.equal(controller.getSnapshot().phase, "alias");
  await controller.setAlias("River"); assert.equal(controller.getSnapshot().phase, "ready");
});
test("revocation closes a ready account; a failed link never opens evidence", async () => {
  const f = fixture(); const controller = createAuthController(f.adapter);
  await controller.restore(); controller.revoked(); assert.equal(f.owner(), null);
  f.adapter.consumeLink = async () => { throw new Error("expired"); };
  await controller.consumeLink({ type: "recovery", token_hash: "used" });
  assert.equal(f.owner(), null); assert.match(controller.getSnapshot().message, /expired/);
});
test("offline restore is usable, while a definite authentication rejection closes it", async () => {
  const f = fixture(); f.adapter.restore = async () => ({ id: "a", alias: "A", offline: true });
  const controller = createAuthController(f.adapter); await controller.restore();
  assert.equal(controller.getSnapshot().offline, true);
  f.adapter.restore = async () => { throw new Error("revoked"); };
  await controller.restore(); assert.equal(f.owner(), null); assert.equal(controller.getSnapshot().phase, "signed-out");
});
test("dispose ignores pending results and stops notifications", async () => {
  const f = fixture(); const delayed = pending(); f.adapter.restore = () => delayed.promise;
  const controller = createAuthController(f.adapter); const restoring = controller.restore();
  controller.dispose(); delayed.resolve({ id: "a", alias: "A" }); await restoring;
  assert.equal(f.owner(), null);
});
test("unmount cancels an attempt, but effect replay can start a new one", async () => {
  const f = fixture(); const delayed = pending(); f.adapter.restore = () => delayed.promise;
  const controller = createAuthController(f.adapter); const restoring = controller.restore();
  controller.cancelPending(); delayed.resolve({ id: "a", alias: "A" }); await restoring;
  assert.equal(f.owner(), null);
  f.adapter.restore = async () => ({ id: "b", alias: "B" }); await controller.restore();
  assert.equal(f.owner(), "b");
});
test("storage refusal still locks the screen and reports incomplete sign-out", async () => {
  const f = fixture(); const controller = createAuthController(f.adapter);
  await controller.restore();
  f.adapter.closeScope = () => { throw new Error("storage denied"); };
  f.adapter.forget = () => { throw new Error("storage denied"); };
  await controller.signOut();
  assert.equal(controller.getSnapshot().phase, "signed-out");
  assert.match(controller.getSnapshot().message, /could not finish/);
});
test("offline proof checks signature, owner, issuer, role and prior confirmation, while allowing expiry", async () => {
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const jwk = { ...await exportJWK(publicKey), kid: "synthetic" };
  const issuer = "https://auth.example.test/auth/v1";
  const now = Math.floor(Date.now() / 1000);
  const sign = (overrides = {}) => new SignJWT({ role: "authenticated", session_id: "synthetic-session", ...overrides })
    .setProtectedHeader({ alg: "ES256", kid: "synthetic" }).setSubject("a").setIssuer(issuer)
    .setAudience("authenticated").setIssuedAt(now - 7200).setExpirationTime(now - 3600).sign(privateKey);
  const proof = { issuer, accountId: "a", alias: "River", confirmed: true, jwks: { keys: [jwk] }, token: await sign() };
  assert.deepEqual(await verifyOfflineProof(proof, issuer), { id: "a", alias: "River" });
  assert.equal(await verifyOfflineProof({ ...proof, accountId: "b" }, issuer), null);
  assert.equal(await verifyOfflineProof({ ...proof, confirmed: false }, issuer), null);
  assert.equal(await verifyOfflineProof(proof, "https://other.test/auth/v1"), null);
  assert.equal(await verifyOfflineProof({ ...proof, token: await sign({ role: "anon" }) }, issuer), null);
  const parts = proof.token.split("."); const claims = JSON.parse(Buffer.from(parts[1], "base64url"));
  claims.sub = "b"; parts[1] = Buffer.from(JSON.stringify(claims)).toString("base64url");
  assert.equal(await verifyOfflineProof({ ...proof, accountId: "b", token: parts.join(".") }, issuer), null);
  assert.equal(await verifyOfflineProof({ accountId: "a" }, issuer), null);
});
