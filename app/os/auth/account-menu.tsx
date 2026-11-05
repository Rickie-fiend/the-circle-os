"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAccountIdentity, type AccountIdentity } from "./account-context";

export function AccountMenu({ floating = false }: { floating?: boolean }) {
  const account = useAccountIdentity();
  return account ? <AccountControl key={account.accountId} account={account} floating={floating} /> : null;
}

function AccountControl({ account, floating }: { account: AccountIdentity; floating: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [alias, setAlias] = useState(account.alias);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  function close() {
    setOpen(false); setEditing(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) { setOpen(false); setEditing(false); }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault(); setOpen(false); setEditing(false); trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (account.busy) return;
    if (alias.trim() === account.alias || await account.saveAlias(alias)) close();
  }

  return <div className={`os-account-control${floating ? " os-account-floating" : ""}`} ref={wrapper}>
    <button className="os-account-trigger" type="button" ref={trigger} aria-label="Open account"
      aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => { if (open) close(); else { setAlias(account.alias); setOpen(true); } }}>
      <span aria-hidden="true">⋯</span>
    </button>
    {open && <div className={`os-account-menu${editing ? " is-editing" : ""}`} id={menuId} role="group" aria-label="Account">
      {editing ? <form onSubmit={save} aria-busy={account.busy}>
        <label>Alias<input name="alias" autoComplete="nickname" value={alias} maxLength={40} required autoFocus
          onChange={event => setAlias(event.target.value)} /></label>
        <div className="os-account-actions">
          <button type="submit" disabled={account.busy || !alias.trim()}>Save alias</button>
          <button type="button" disabled={account.busy} onClick={close}>Cancel</button>
        </div>
      </form> : <>
        <button type="button" disabled={account.busy} onClick={() => { setAlias(account.alias); setEditing(true); }}>Edit alias</button>
        <button type="button" disabled={account.busy} onClick={() => { void account.signOut(); }}>Sign out</button>
      </>}
      {account.message && <p role="status">{account.message}</p>}
    </div>}
  </div>;
}
