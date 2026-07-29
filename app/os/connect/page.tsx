"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { checkLocalAi } from "../circle-os-ai";
import { OSFrame, useCircleState } from "../circle-os-shell";

export default function ConnectCircleAi() {
  const { state, ready, connectAi } = useCircleState();

  return (
    <ConnectForm
      key={ready ? "ready" : "opening"}
      initialAddress={state.ai.baseUrl}
      initialToken={state.ai.token}
      connectAi={connectAi}
    />
  );
}

function ConnectForm({
  initialAddress,
  initialToken,
  connectAi,
}: {
  initialAddress: string;
  initialToken: string;
  connectAi: (address: string, token: string) => void;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setMessage("");
    try {
      await checkLocalAi(address, token);
      connectAi(address, token);
      setMessage("Connected.");
    } catch {
      setMessage("Could not connect. Your phone data is still safe.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <OSFrame active="connect">
      <main className="os-mirror os-connect">
        <section aria-labelledby="connect-title">
          <p className="os-eyebrow">Private AI</p>
          <h1 id="connect-title">Connect your computer.</h1>
          <p>
            Your profile stays on this phone. Your computer only reads it long
            enough to update your Vision.
          </p>
          <form onSubmit={save}>
            <label>
              <span>Address</span>
              <input
                inputMode="url"
                placeholder="https://your-computer.ts.net"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Key</span>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={checking}>
              {checking ? "Checking…" : "Connect"}
            </button>
          </form>
          <p className="connect-message" aria-live="polite">
            {message}
          </p>
          <Link href="/os/mirror">Back to Vision</Link>
        </section>
      </main>
    </OSFrame>
  );
}
