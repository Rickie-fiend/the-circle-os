"use client";

import { useEffect, useState } from "react";
import type { WritingImprintPulse } from "../writing-provider";
import { StrandCanvas } from "./imprint-strand-canvas";
import type { ImprintDay } from "./imprint-writing-activity";
import variants from "./imprint-art-variants.json";
import groups from "./imprint-strand-layout.json";

type Props = { days: ImprintDay[]; revision: number; claimPulses: () => WritingImprintPulse[] };

export default function WritingImprintReview({ days, revision, claimPulses }: Props) {
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const refreshClock = () => setClock(Date.now());
    refreshClock();
    document.addEventListener("visibilitychange", refreshClock);
    return () => document.removeEventListener("visibilitychange", refreshClock);
  }, [days]);

  useEffect(() => {
    const next = days.reduce((earliest, { at, fadeAt }) => {
      const savedAt = Date.parse(at);
      if (savedAt > clock) earliest = Math.min(earliest, savedAt);
      return fadeAt > clock ? Math.min(earliest, fadeAt) : earliest;
    }, Infinity);
    if (!Number.isFinite(next)) return;
    const timer = window.setTimeout(() => setClock(Date.now()), Math.min(2_147_483_647, Math.max(1, next - Date.now())));
    return () => window.clearTimeout(timer);
  }, [days, clock]);

  return <StrandCanvas variants={variants} groups={groups}
    days={days} clock={clock} revision={revision} claimPulses={claimPulses} />;
}
