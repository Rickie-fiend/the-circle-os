"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";

const primaryDestinations = [
  { id: "today", label: "Today", href: "/os/today" },
  { id: "home", label: "Home", href: "/os/home" },
  { id: "reflect", label: "Reflect", href: "/os/mirror" },
] as const;
const explore = { id: "explore", label: "Explore", href: "/os/explore" } as const;
type Destination = typeof primaryDestinations[number] | typeof explore;

function NavigationIcon({ name }: { name: Destination["id"] }) {
  return <svg aria-hidden="true" focusable="false" viewBox={name === "explore" ? "0 0 32 32" : "0 0 24 24"} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {name === "home" ? <path d="M4 10 12 3 20 10v10H4Z" /> : null}
    {name === "today" ? <circle cx="12" cy="12" r="8" /> : null}
    {name === "reflect" ? <><circle cx="9.5" cy="9.5" r="5.5" /><circle cx="14.5" cy="14.5" r="5.5" /></> : null}
    {name === "explore" ? <path stroke="none" fill="currentColor" fillRule="evenodd" d="M16 1 18.6 12.3 23.5 8.5 19.7 13.4 31 16 19.7 18.6 23.5 23.5 18.6 19.7 16 31 13.4 19.7 8.5 23.5 12.3 18.6 1 16 12.3 13.4 8.5 8.5 13.4 12.3Z M16 6 14.45 13 17.55 13Z M26 16 19 14.45 19 17.55Z M16 26 17.55 19 14.45 19Z M6 16 13 17.55 13 14.45Z M18.15 16A2.15 2.15 0 1 0 13.85 16A2.15 2.15 0 1 0 18.15 16Z" /> : null}
  </svg>;
}

export function BottomNavigation({ onNavigate }: { onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  const pathname = usePathname();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const editing = document.activeElement?.matches("textarea, input:not([type=checkbox]):not([type=radio]), [contenteditable=true]");
      setKeyboardOpen(Boolean(editing && window.innerHeight - viewport.height > 120));
    };
    viewport.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);
  function renderDestination(destination: Destination, className?: string) {
    const active = pathname === destination.href || (destination.id === "today" && pathname === "/os");
    return <Link key={destination.id} className={className} href={destination.href}
      aria-current={active ? "page" : undefined} onClick={event => onNavigate(event, destination.href)}>
      <NavigationIcon name={destination.id} /><span>{destination.label}</span>
    </Link>;
  }
  return <nav className="os-bottom-nav" aria-label="Circle OS" hidden={keyboardOpen}>
    <div className="os-bottom-nav-pill">{primaryDestinations.map(destination => renderDestination(destination))}</div>
    {renderDestination(explore, "os-bottom-nav-explore")}
  </nav>;
}
