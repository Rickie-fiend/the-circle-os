"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import { useCircleState } from "../circle-os-shell";
import { useWriting, type WritingContextValue } from "../writing-provider";
import variants from "./imprint-art-variants.json";
import "./imprint.css";

const WritingImprintReview = dynamic(() => import("./imprint-writing-review"));
const plain = variants[1].bone;

function HomeImprint({ days, pulseRevision, takePulses }: NonNullable<WritingContextValue["imprint"]>) {
  const { localImprint: { days: localDays, takePulses: takeLocalPulses } } = useCircleState();
  const allDays = useMemo(() => [...days, ...localDays], [days, localDays]);
  const pathname = usePathname();
  const home = useRef<HTMLElement>(null);
  const claimPulses = useCallback(() => {
    if (pathname !== "/os/home" || document.visibilityState !== "visible" || !home.current?.isConnected ||
        home.current.closest('[aria-hidden="true"]')) return [];
    const activeSources = new Set(allDays.flatMap(day => day.sources));
    return [...takePulses(activeSources), ...takeLocalPulses(activeSources)];
  }, [allDays, pathname, takePulses, takeLocalPulses]);

  return <main ref={home} aria-label="Home">
    <div className="imprint-home-art">
      {/* The plain artwork can paint while Home loads its color renderer and data. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/${plain.path}?v=${plain.hash}`} width={390} height={585} alt="" />
      <WritingImprintReview days={allDays} revision={pulseRevision} claimPulses={claimPulses} />
    </div>
  </main>;
}

export default function CircleOSHome() {
  const writing = useWriting();
  return writing?.imprint
    ? <HomeImprint key={writing.owner} {...writing.imprint} />
    : <main aria-label="Home" />;
}
