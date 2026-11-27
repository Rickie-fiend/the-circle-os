"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ContentFigure, type ContentImage } from "../admin/content-media";
import "./explore.css";

export type ExploreItem = {
  id: string;
  kind: "chapter" | "routine-template" | "protocol-template" | "article";
  version: number;
  title?: string;
  description?: string | null;
  cover?: ContentImage | null;
};

type GlassSlide = {
  key: string;
  label: string;
  content?: ReactNode;
  action?: { label: string; href: string } | { label: string; descriptionId?: string; open: (button: HTMLButtonElement) => void };
};

export function GlassCarousel({ label, heading, slides }: {
  label: string;
  heading?: string;
  slides: GlassSlide[];
}) {
  const headingId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const count = slides.length;

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
  }, [count]);

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
    const next = event.key === "ArrowRight" ? Math.min(count - 1, selected + 1)
      : event.key === "ArrowLeft" ? Math.max(0, selected - 1)
        : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
    if (next === null) return;
    event.preventDefault();
    moveTo(next);
  }

  return <section className="os-explore-row">
    {heading ? <h2 id={headingId} className="os-explore-row-title">{heading}</h2> : null}
    <div ref={viewport} className="os-explore-carousel" role="region" aria-roledescription="carousel" aria-label={heading ? undefined : label} aria-labelledby={heading ? headingId : undefined} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="os-explore-track">
        {slides.map((slide, index) => {
          const action = slide.action;
          return <article key={slide.key} className={`os-content-glass os-explore-panel${index === selected ? " is-selected" : ""}`} role="group" aria-roledescription="slide" aria-label={slide.label} onFocus={() => moveTo(index)}>
            {action && ("href" in action
              ? <a className="os-explore-open" aria-label={action.label} href={action.href} />
              : <button className="os-explore-open" aria-label={action.label} aria-describedby={action.descriptionId} type="button" onClick={event => action.open(event.currentTarget)} />)}
            {slide.content}
          </article>;
        })}
      </div>
    </div>
  </section>;
}

export function ExploreCarousel({ title, items }: { title: string; items: ExploreItem[] }) {
  const panels = items.length > 1 ? items : items.length ? [items[0], null] : [null, null];
  return <GlassCarousel label={title} heading={title} slides={panels.map((item, index) => item ? {
    key: `${item.id}@${item.version}`,
    label: `${index + 1} of ${panels.length}`,
    content: <>
      {item.cover ? <ContentFigure image={item.cover} /> : null}
      {item.title?.trim() ? <h3>{item.title}</h3> : null}
      {item.description?.trim() ? <p>{item.description}</p> : null}
    </>,
    action: {
      label: `Open ${item.title?.trim() || title}`,
      href: `/os/catalog/read?id=${encodeURIComponent(item.id)}&version=${item.version}${item.kind === "chapter" ? "&resume=1" : ""}`,
    },
  } : { key: `empty-${index}`, label: "Empty panel" })} />;
}
