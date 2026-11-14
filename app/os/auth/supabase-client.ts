import { createClient, type Session } from "@supabase/supabase-js";
import { activateAccountScope, getAccountScope } from "../account-scope";
import { verifyOfflineProof, type OfflineProof } from "./offline-proof";
import type { AuthAdapter } from "./auth-controller";
import { localAuth } from "./offline-auth-store";

export type AuthConfig = { mode: "legacy" | "supabase" | "test" | "invalid"; url: string; key: string };
export function readAuthConfig(): AuthConfig {
  const mode = process.env.NEXT_PUBLIC_CIRCLE_AUTH_MODE || "legacy";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (mode === "legacy") return { mode, url: "", key: "" };
  if (mode === "test") return { mode: process.env.NODE_ENV === "development" ? "test" : "invalid", url: "", key: "" };
  try {
    const parsed = new URL(url);
    if (mode !== "supabase" || !key || parsed.username || parsed.password ||
      (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))) throw new Error();
    return { mode, url: parsed.origin, key };
  } catch { return { mode: "invalid", url: "", key: "" }; }
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof Error &&
    (error.name === "AuthRetryableFetchError" || error.name === "TimeoutError"));
}

export function createSupabaseAdapter(config: AuthConfig) {
  const issuer = `${config.url}/auth/v1`;
  const prefix = `circle-os-auth:${new URL(config.url).host}`;
  const proofKey = `${prefix}:offline`;
  const closedKey = `${prefix}:closed`;
  const flowKey = `${prefix}:password`;
  const storageKey = `${prefix}:session`;
  const client = createClient(config.url, config.key, {
    auth: { storageKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: "pkce" },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal || AbortSignal.timeout(12_000) }) },
  });
  let revision = 0;
  function readProof(): OfflineProof | null {
    try { return JSON.parse(localStorage.getItem(proofKey) || "null"); } catch { return null; }
  }
  const assertCurrent = (attempt: number) => { if (attempt !== revision) throw new Error("The account changed. Please sign in again."); };
  async function forget() {
    ++revision;
    localStorage.setItem(closedKey, "yes");
    localStorage.removeItem(proofKey);
    localStorage.removeItem(flowKey);
    await localAuth(prefix, { proof: null });
  }
  async function offline() {
    const attempt = revision;
    if (localStorage.getItem(closedKey) === "yes" || localStorage.getItem(flowKey)) return null;
    let stored = await localAuth(prefix);
    if (!stored) {
      const old = readProof();
      if (!await verifyOfflineProof(old, issuer)) return null;
      stored = await localAuth(prefix, { proof: old, expected: null });
    }
    const identity = await verifyOfflineProof(stored?.proof || null, issuer);
    const current = await localAuth(prefix);
    assertCurrent(attempt);
    if (current?.epoch !== stored?.epoch || localStorage.getItem(closedKey) === "yes" || localStorage.getItem(flowKey)) return null;
    return identity ? { ...identity, offline: true } : null;
  }
  async function verify(session: Session | null, attempt: number, epoch: string | null) {
    assertCurrent(attempt);
    if (!session) return null;
    const { data, error } = await client.auth.getUser(session.access_token);
    assertCurrent(attempt);
    if (error) throw error;
    const user = data.user;
    if (!user?.email_confirmed_at || user.id !== session.user.id) throw new Error("Verify your email before signing in.");
    const response = await fetch(`${issuer}/.well-known/jwks.json`, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
    if (!response.ok) throw new Error("Could not check this session. Please try again.");
    const jwks = await response.json();
    assertCurrent(attempt);
    const alias = typeof user.user_metadata?.alias === "string" ? user.user_metadata.alias.trim().slice(0, 40) : "";
    const proof: OfflineProof = { issuer, accountId: user.id, alias, token: session.access_token, jwks, confirmed: true };
    if (!await verifyOfflineProof(proof, issuer)) throw new Error("This project needs an asymmetric signing key before offline access can be used.");
    assertCurrent(attempt);
    await localAuth(prefix, { proof, expected: epoch });
    assertCurrent(attempt);
    localStorage.setItem(proofKey, JSON.stringify(proof));
    localStorage.removeItem(closedKey);
    return { id: user.id, alias };
  }
  const adapter: AuthAdapter = {
    cancelPending() { ++revision; },
    openScope(id) {
      const scope = getAccountScope();
      if (scope.kind !== "account" || scope.accountId !== id) activateAccountScope(id);
    },
    closeScope() { if (getAccountScope().kind !== "signed-out") activateAccountScope(null); },
    forget,
    async restore() {
      const attempt = revision;
      if (localStorage.getItem(flowKey)) {
        if (!navigator.onLine) throw new Error("Connect to the internet to finish setting your password.");
        const { data, error } = await client.auth.getSession();
        assertCurrent(attempt);
        if (error || !data.session) throw new Error("Please request a new password link.");
        const checked = await client.auth.getUser(data.session.access_token);
        assertCurrent(attempt);
        if (checked.error || !checked.data.user?.email_confirmed_at) throw new Error("Please request a new password link.");
        return { id: checked.data.user.id, alias: "", passwordRequired: true };
      }
      if (localStorage.getItem(closedKey) === "yes" || (await localAuth(prefix))?.proof === null) return null;
      // Recovery/invitation sessions are never normal app sessions until the
      // new password has been saved, including across a browser reload.
      if (!navigator.onLine) return offline();
      const epoch = (await localAuth(prefix))?.epoch ?? null;
      try {
        const { data, error } = await client.auth.getSession();
        assertCurrent(attempt);
        if (error) throw error;
        const identity = await verify(data.session, attempt, epoch);
        if (!identity) await forget();
        return identity;
      } catch (error) {
        assertCurrent(attempt);
        if (isNetworkError(error)) return offline();
        if (error instanceof Error && error.name === "AuthScopeChanged") throw error;
        await forget(); throw error;
      }
    },
    async signIn(email, password) {
      if (!navigator.onLine) throw new Error("Connect to the internet to sign in.");
      await forget(); const attempt = revision;
      const epoch = (await localAuth(prefix))?.epoch ?? null;
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      assertCurrent(attempt);
      if (error) throw error;
      localStorage.removeItem(flowKey);
      const identity = await verify(data.session, attempt, epoch);
      client.auth.startAutoRefresh();
      return identity;
    },
    async consumeLink(link) {
      if (!navigator.onLine) throw new Error("Connect to the internet to open this link.");
      await forget(); const attempt = revision;
      localStorage.setItem(flowKey, link.type);
      const { error } = await client.auth.verifyOtp(link);
      assertCurrent(attempt);
      if (error) throw error;
    },
    async setPassword(password) {
      if (!navigator.onLine) throw new Error("Connect to the internet to save your password.");
      if (!localStorage.getItem(flowKey)) throw new Error("Please request a new password link.");
      const attempt = revision;
      const epoch = (await localAuth(prefix))?.epoch ?? null;
      const { error } = await client.auth.updateUser({ password });
      assertCurrent(attempt);
      if (error) throw error;
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const identity = await verify(data.session, attempt, epoch);
      assertCurrent(attempt); localStorage.removeItem(flowKey);
      return identity;
    },
    async setAlias(alias) {
      const value = alias.trim();
      if (!value || value.length > 40) throw new Error("Use an alias between 1 and 40 letters or characters.");
      if (!navigator.onLine) throw new Error("Connect to the internet to save your alias.");
      const attempt = revision;
      const epoch = (await localAuth(prefix))?.epoch ?? null;
      const { error } = await client.auth.updateUser({ data: { alias: value } });
      assertCurrent(attempt);
      if (error) throw error;
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      return verify(data.session, attempt, epoch);
    },
    async signOut() {
      client.auth.stopAutoRefresh();
      // Remove persisted SDK credentials even when revocation cannot reach
      // Supabase. The tombstone prevents a late SDK response restoring access.
      try {
        if (!navigator.onLine) return;
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw error;
      } finally { localStorage.removeItem(storageKey); }
    },
    message(error) {
      if (isNetworkError(error)) return "Could not connect. Your saved records are still on this phone.";
      if (error instanceof Error && /email not confirmed/i.test(error.message)) return "Verify your email before signing in. Ask for a new invite if your link has expired.";
      if (error instanceof Error && /invalid login/i.test(error.message)) return "That email or password did not work.";
      if (error instanceof Error && /rate|too many/i.test(error.message)) return "Please wait a little before trying again.";
      return error instanceof Error ? error.message : "Something went wrong. Please try again.";
    },
  };
  return {
    adapter, client, proofKey, closedKey, storageKey,
    async requestReset(email: string) {
      if (!navigator.onLine) throw new Error("Connect to the internet to request a link.");
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/os/auth/confirm` });
      if (error) throw error;
    },
  };
}
