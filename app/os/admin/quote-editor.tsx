"use client";

import { useEffect, useState, type FormEvent } from "react";
import { QUOTE_TEXT_LIMIT, quoteCatalog, type Quote } from "../quotes/quote-model.js";

export function QuoteEditor() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  async function load(signal?: AbortSignal) {
    const response = await fetch("/os/admin/quotes", { cache: "no-store", signal });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || "Could not open quotes.");
    return quoteCatalog(value);
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then(value => { setQuotes(value); setLoaded(true); }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  async function change(method: "POST" | "DELETE", value: unknown) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/os/admin/quotes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save quotes.");
      // Accepted mutations are reflected immediately, even if a later refresh fails.
      const changed = quoteCatalog(result);
      if (method === "POST") { setQuotes(current => [...current, ...changed]); setText(""); setAuthor(""); }
      else { setQuotes(current => current.filter(item => !changed.some(removed => removed.id === item.id))); setRemoving(null); }
      setLoaded(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save quotes."); }
    finally { setBusy(false); }
  }
  function add(event: FormEvent) { event.preventDefault(); if (!busy && text.trim()) void change("POST", { text, author }); }
  return <section className="os-admin-library os-admin-quotes" aria-label="Quote library">
    <div className="os-admin-section-head"><div><p>Library</p><h2>Quotes</h2></div></div>
    {error ? <p role="alert">{error} <button type="button" disabled={busy} onClick={() => { setError(""); setBusy(true); void load().then(value => { setQuotes(value); setLoaded(true); }).catch(cause => setError(cause.message)).finally(() => setBusy(false)); }}>Try again</button></p> : null}
    <form className="os-admin-panel os-admin-fields" onSubmit={add}>
      <label className="os-admin-field"><span>Quote</span><textarea disabled={busy} value={text} maxLength={QUOTE_TEXT_LIMIT} onChange={event => setText(event.target.value)} required /></label>
      <label className="os-admin-field"><span>Author (optional)</span><input disabled={busy} value={author} maxLength={QUOTE_TEXT_LIMIT} onChange={event => setAuthor(event.target.value)} /></label>
      <div className="os-admin-actions"><button type="submit" disabled={busy || !text.trim()}>Add quote</button></div>
    </form>
    {loaded && !quotes.length ? <p>No quotes yet.</p> : null}
    <div className="os-admin-draft-list">{quotes.map(quote => <article key={quote.id}>
      <blockquote><p>{quote.text}</p>{quote.author ? <cite>{quote.author}</cite> : null}</blockquote>
      {removing === quote.id ? <div className="os-admin-quote-actions"><button type="button" disabled={busy} onClick={() => void change("DELETE", { id: quote.id })}>Confirm removal</button><button type="button" disabled={busy} onClick={() => setRemoving(null)}>Cancel</button></div> : <div className="os-admin-quote-actions is-single"><button type="button" disabled={busy} onClick={() => setRemoving(quote.id)}>Remove quote</button></div>}
    </article>)}</div>
  </section>;
}
