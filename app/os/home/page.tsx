"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWriting, type WritingContextValue } from "../writing-provider";
import type { Pulse } from "./imprint-activity-canvas";

const WritingImprintReview = dynamic(() => import("./imprint-writing-review"));

function HomeImprint({ days, pulseRevision, takePulses }: NonNullable<WritingContextValue["imprint"]>) {
  const pathname = usePathname();
  const home = useRef<HTMLElement>(null);
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useEffect(() => {
    if (pathname !== "/os/home") return;
    const claimPulses = () => {
      if (document.visibilityState !== "visible" || !home.current?.isConnected ||
          home.current.closest('[aria-hidden="true"]')) return;
      const events = takePulses(new Set(days.flatMap(day => day.sources)));
      if (events.length) setPulses(events);
    };
    claimPulses();
    document.addEventListener("visibilitychange", claimPulses);
    return () => document.removeEventListener("visibilitychange", claimPulses);
  }, [days, pathname, pulseRevision, takePulses]);

  return <main ref={home} aria-label="Home">
    <WritingImprintReview days={days} pulses={pulses} />
  </main>;
}

export default function CircleOSHome() {
  const writing = useWriting();
  return writing?.imprint
    ? <HomeImprint key={writing.owner} {...writing.imprint} />
    : <main aria-label="Home" />;
}
