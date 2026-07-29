"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { checkLocalAi } from "../circle-os-ai";
import { useCircleState } from "../circle-os-shell";

export default function ConnectCircleAi() {
  const { state, ready, connectAi } = useCircleState();
  const router = useRouter();

  return (
    <ConnectForm
      key={ready ? "ready" : "opening"}
      initialAddress={state.ai.baseUrl}
      initialToken={state.ai.token}
      connectAi={connectAi}
      onConnected={() => router.replace("/os/mirror")}
    />
  );
}

function ConnectForm({
  initialAddress,
  initialToken,
  connectAi,
  onConnected,
}: {
  initialAddress: string;
  initialToken: string;
  connectAi: (address: string, token: string) => Promise<void>;
  onConnected: () => void;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setMessage("");
    try {
      await checkLocalAi(address);
      await connectAi(address, initialToken);
      setMessage("Connected. Opening Vision…");
      onConnected();
    } catch {
      setMessage("Could not connect. Your phone copy is still safe.");
    } finally {
      setChecking(false);
    }
  }

  return (
      <main className="os-mirror os-connect">
        <section aria-labelledby="connect-title">
          <p className="os-eyebrow">Profile server</p>
          <h1 id="connect-title">Connect Obsidian.</h1>
          <p>
            Your profile and days live in your Obsidian vault. Your phone keeps
            a copy when your computer is away.
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
  );
}
