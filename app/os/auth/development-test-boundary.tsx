"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getAccountScope, getServerAccountScope, subscribeAccountScope } from "../account-scope";
import { isDevelopmentTestAccount, openDevelopmentTestSession } from "./development-test-session";

export function DevelopmentTestBoundary({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") return null;
  return <DevelopmentTestSession>{children}</DevelopmentTestSession>;
}

function DevelopmentTestSession({ children }: { children: ReactNode }) {
  const scope = useSyncExternalStore(subscribeAccountScope, getAccountScope, getServerAccountScope);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  function open(fresh = false) {
    try { openDevelopmentTestSession(fresh); setReady(true); setMessage(""); }
    catch { setMessage("Could not open a test session. Check that browser storage is available."); }
  }
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) open(); });
    return () => { active = false; };
  }, []);
  return <>
    <div className="circle-os os-auth-bar">
      <span>Test mode · </span><button type="button" onClick={() => open(true)}>New test session</button>
      {message && <p role="status">{message}</p>}
    </div>
    {ready && isDevelopmentTestAccount(scope) ? children : <div className="circle-os"><p role="status">Opening a test session…</p></div>}
  </>;
}
