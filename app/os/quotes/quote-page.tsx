"use client";

import { InfoPage } from "../app-session";
import { CreativeButton } from "../button-engine";
import type { Quote } from "./quote-model.js";

export type QuoteNavigation = { back: () => void; forward: () => void };

export function QuotePage({ quote, onReact, className = "" }: {
  quote: Quote; onReact: (reaction: string) => void; className?: string;
}) {
  return <InfoPage className={`os-line-page os-quote-page ${className}`} header={<span className="os-line-kind">QUOTE</span>}
    footer={<div className="os-line-reactions" role="group" aria-label="How was this?">
      <CreativeButton type="button" sizing="content" release="latch" styleId="default" onClick={() => onReact("loved")}>Loved it</CreativeButton>
      <CreativeButton type="button" sizing="content" release="latch" styleId="default" onClick={() => onReact("not-for-me")}>Not for me</CreativeButton>
    </div>}>
    <div className="os-info-page-main"><h2>{quote.text}</h2></div>
    {quote.author ? <div className="os-info-page-sub"><p className="os-line-sub">{quote.author}</p></div> : null}
  </InfoPage>;
}
