"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ContentFigure, type ContentImage } from "../admin/content-media";

export type ExploreItem = {
  id: string;
  kind: "chapter" | "routine-template" | "protocol-template" | "article";
  version: number;
  title?: string;
  description?: string | null;
  cover?: ContentImage | null;
};

export function ExploreCarousel({ title, items }: { title: string; items: ExploreItem[] }) {
  const headingId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const panels = items.length > 1 ? items : items.length ? [items[0], null] : [null, null];

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const centre = bounds.left + bounds.width / 2;
      let nearest = 0;
      let distance = Infinity;
      for (const [index, panel] of Array.from(element.querySelectorAll<HTMLElement>(".os-explore-panel")).entries()) {
        const box = panel.getBoundingClientRect();
        const delta = Math.abs(box.left + box.width / 2 - centre);
        if (delta < distance) { nearest = index; distance = delta; }
      }
      setSelected(nearest);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    element.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", schedule);
    };
  }, [items]);

  function moveTo(index: number) {
    const element = viewport.current;
    const panel = element?.querySelectorAll<HTMLElement>(".os-explore-panel")[index];
    if (!element || !panel) return;
    const bounds = element.getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    element.scrollTo({
      left: element.scrollLeft + box.left + box.width / 2 - bounds.left - bounds.width / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = event.key === "ArrowRight" ? Math.min(panels.length - 1, selected + 1)
      : event.key === "ArrowLeft" ? Math.max(0, selected - 1)
        : event.key === "Home" ? 0 : event.key === "End" ? panels.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    moveTo(next);
  }

  return <section className="os-explore-row">
    <h2 id={headingId} className="os-explore-row-title">{title}</h2>
    <div ref={viewport} className="os-explore-carousel" role="region" aria-roledescription="carousel" aria-labelledby={headingId} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="os-explore-track">
        {panels.map((item, index) => <article key={item ? `${item.id}@${item.version}` : `empty-${index}`} className={`os-content-glass os-explore-panel${index === selected ? " is-selected" : ""}`} role="group" aria-roledescription="slide" aria-label={item ? `${index + 1} of ${panels.length}` : "Empty panel"}>
          {item?.cover ? <ContentFigure image={item.cover} /> : null}
          {item?.title?.trim() ? <h3>{item.title}</h3> : null}
          {item?.description?.trim() ? <p>{item.description}</p> : null}
          {item ? <a className="os-explore-open" aria-label={`Open ${item.title?.trim() || title}`} href={`/os/catalog/read?id=${encodeURIComponent(item.id)}&version=${item.version}`} onFocus={() => moveTo(index)} /> : null}
        </article>)}
      </div>
    </div>
  </section>;
}
