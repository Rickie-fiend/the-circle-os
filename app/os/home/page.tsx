"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCircleState } from "../circle-os-shell";
import { useWriting, type WritingContextValue, type WritingImprintPulse } from "../writing-provider";

const WritingImprintReview = dynamic(() => import("./imprint-writing-review"));

function HomeImprint({ days, pulseRevision, takePulses }: NonNullable<WritingContextValue["imprint"]>) {
  const { localImprint: { days: localDays, takePulses: takeLocalPulses } } = useCircleState();
  const allDays = useMemo(() => [...days, ...localDays], [days, localDays]);
  const pathname = usePathname();
  const home = useRef<HTMLElement>(null);
  const [pulses, setPulses] = useState<WritingImprintPulse[]>([]);

  useLayoutEffect(() => {
    if (pathname !== "/os/home") return;
    const claimPulses = () => {
      if (document.visibilityState !== "visible" || !home.current?.isConnected ||
          home.current.closest('[aria-hidden="true"]')) return;
      const activeSources = new Set(allDays.flatMap(day => day.sources));
      const events = [...takePulses(activeSources), ...takeLocalPulses(activeSources)];
      if (events.length) setPulses(previous => [
        ...previous.filter(pulse => !events.some(event => event.group === pulse.group)),
        ...events,
      ]);
    };
    claimPulses();
    document.addEventListener("visibilitychange", claimPulses);
    return () => document.removeEventListener("visibilitychange", claimPulses);
  }, [allDays, pathname, pulseRevision, takePulses, takeLocalPulses]);

  return <main ref={home} aria-label="Home">
    <WritingImprintReview days={allDays} pulses={pulses} />
  </main>;
}

export default function CircleOSHome() {
  const writing = useWriting();
  return writing?.imprint
    ? <HomeImprint key={writing.owner} {...writing.imprint} />
    : <main aria-label="Home" />;
}
