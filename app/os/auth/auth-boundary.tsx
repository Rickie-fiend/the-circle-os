"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { getAccountScope, getServerAccountScope, subscribeAccountScope } from "../account-scope";
import { createAuthController } from "./auth-controller";
import { createSupabaseAdapter, readAuthConfig, type AuthConfig } from "./supabase-client";
import { DevelopmentTestBoundary } from "./development-test-boundary";

export function CircleAuthBoundary({ children }: { children: ReactNode }) {
  const config = readAuthConfig();
  if (config.mode === "legacy") return children;
  if (config.mode === "test" && process.env.NODE_ENV === "development") return <DevelopmentTestBoundary>{children}</DevelopmentTestBoundary>;
  if (config.mode === "invalid") return <AuthSurface title="Sign-in is not ready."><p>Please ask the person who invited you to check the app setup.</p></AuthSurface>;
  return <SupabaseAuthBoundary config={config}>{children}</SupabaseAuthBoundary>;
}

function AuthSurface({ title, children }: { title: string; children: ReactNode }) {
  return <div className="circle-os"><main className="os-auth"><section aria-labelledby="auth-title">
    <p className="os-eyebrow">Circle OS</p><h1 id="auth-title">{title}</h1>{children}
  </section></main></div>;
}

export function SupabaseAuthBoundary({ config, children }: { config: AuthConfig; children: ReactNode }) {
  const [runtime] = useState(() => {
    const connection = createSupabaseAdapter(config);
    return { ...connection, controller: createAuthController(connection.adapter) };
  });
  const { controller, client, adapter } = runtime;
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const scope = useSyncExternalStore(subscribeAccountScope, getAccountScope, getServerAccountScope);
  const [reset, setReset] = useState(false);
  const [account, setAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // Hash links work across devices and keep the one-use secret out of HTTP,
    // access logs, and the existing navigation service-worker cache.
    const params = new URLSearchParams(location.hash.slice(1));
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    const link = token_hash && (type === "invite" || type === "recovery") ? { token_hash, type } as const : null;
    let active = true;
    const restore = () => { if (active && ["ready", "signed-out"].includes(controller.getSnapshot().phase)) void controller.restore(); };
    const { data } = client.auth.onAuthStateChange((event) => {
      // Do not await SDK calls inside its auth lock.
      if (event === "SIGNED_OUT") controller.revoked();
      if (event === "TOKEN_REFRESHED" && controller.getSnapshot().phase === "ready") setTimeout(restore, 0);
    });
    const storage = (event: StorageEvent) => {
      if ((event.key === runtime.closedKey && event.newValue === "yes") || event.key === null) controller.revoked();
      else if (event.key === runtime.proofKey && event.newValue && controller.getSnapshot().phase !== "checking") restore();
    };
    const focus = () => { if (navigator.onLine && document.visibilityState === "visible") restore(); };
    window.addEventListener("storage", storage);
    window.addEventListener("online", restore);
    document.addEventListener("visibilitychange", focus);
    queueMicrotask(() => {
      if (!active) return;
      if (token_hash || params.has("error")) history.replaceState(null, "", location.pathname);
      if (link) void controller.consumeLink(link);
      else if (params.has("error")) controller.revoked();
      else void controller.restore();
    });
    return () => {
      active = false; controller.cancelPending(); data.subscription.unsubscribe();
      window.removeEventListener("storage", storage);
      window.removeEventListener("online", restore);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [controller, client, runtime]);

  // A forged or changed storage marker must never select a different account
  // beneath an otherwise valid login. The provider is mounted only on a match.
  const canOpen = state.phase === "ready" && scope.kind === "account" && scope.accountId === state.accountId;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") || "");
    if (state.phase === "password" && password !== fields.get("confirmation")) { setNotice("The passwords do not match."); return; }
    setBusy(true); setNotice("");
    try {
      if (reset) {
        await runtime.requestReset(String(fields.get("email") || ""));
        setNotice("If this email has an account, a reset link is on its way. Check your spam folder too.");
      } else if (state.phase === "password") await controller.setPassword(password);
      else if (state.phase === "alias") await controller.setAlias(String(fields.get("alias") || ""));
      else await controller.signIn(String(fields.get("email") || ""), password);
    } catch (error) { setNotice(adapter.message(error)); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setAccount(false); setNotice("");
    try { await controller.signOut(); } finally { setBusy(false); }
  }

  if (canOpen) return <>
    <div className="circle-os os-auth-bar">
      <button type="button" onClick={() => setAccount(!account)} aria-label="Open account" aria-expanded={account}>{state.alias}{state.offline ? " · Offline" : ""}</button>
      {account && <div className="os-auth-menu" role="group" aria-label="Account">
        <button className="os-page-primary-action" disabled={busy} onClick={() => { void signOut(); }}>Sign out on this device</button>
      </div>}
    </div>
    {children}
  </>;
  if (state.phase === "checking") return <AuthSurface title="Opening Circle OS…"><p role="status">Checking your sign-in.</p></AuthSurface>;
  const passwordFlow = state.phase === "password";
  const aliasFlow = state.phase === "alias";
  const title = reset ? "Reset your password." : passwordFlow ? "Set your password." : aliasFlow ? "What shall we call you?" : "Welcome back.";
  return <AuthSurface title={title}>
    {!passwordFlow && !aliasFlow && !reset && <p>Sign in with the email you were invited with.</p>}
    {aliasFlow && <p>Choose an alias. You do not need to use your real name.</p>}
    <form onSubmit={submit} key={`${state.phase}:${reset}`} aria-busy={busy}>
      {aliasFlow ? <label>Alias<input name="alias" autoComplete="nickname" maxLength={40} required /></label> : <>
        {!passwordFlow && <label>Email<input name="email" type="email" autoComplete="username" autoCapitalize="none" required /></label>}
        {!reset && <label>{passwordFlow ? "New password" : "Password"}<input name="password" type="password" autoComplete={passwordFlow ? "new-password" : "current-password"} minLength={passwordFlow ? 8 : undefined} required /></label>}
        {passwordFlow && <label>Repeat password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>}
      </>}
      <button className="os-page-primary-action" type="submit" disabled={busy}>{busy ? "Please wait…" : reset ? "Send reset link" : passwordFlow ? "Save password" : aliasFlow ? "Continue" : "Sign in"}</button>
    </form>
    <p role="status" aria-live="polite">{notice || state.message || (state.phase === "ready" ? "Your account changed. Please sign in again." : "")}</p>
    {!aliasFlow && !passwordFlow && <button className="os-auth-link" type="button" disabled={busy} onClick={() => { setReset(!reset); setNotice(""); }}>{reset ? "Back to sign in" : "Forgot password?"}</button>}
    {(aliasFlow || passwordFlow) && <button className="os-auth-link" type="button" disabled={busy} onClick={() => { void signOut(); }}>Cancel and sign out</button>}
    {!aliasFlow && !passwordFlow && !reset && <p>Need a new invite link? Ask the person who invited you to send another.</p>}
  </AuthSurface>;
}
