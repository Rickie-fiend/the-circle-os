"use client";

import { useEffect, useMemo, useState } from "react";
import type { WritingImprintPulse } from "../writing-provider";
import { ActivityCanvas, type Sample } from "./imprint-activity-canvas";
import { growthFromContributions } from "./imprint-activity-model.js";
import { writingImprintContributions, type ImprintDay } from "./imprint-writing-activity";
import type { Anchors } from "./imprint-growth-model.js";
import colorStudy from "../../../docs/design/personal-imprint-color-v1.json";
import growthStudy from "../../../docs/design/personal-imprint-growth-v1.json";

const sori = colorStudy.samples.find(sample => sample.id === "sori")!;
const anchors: Anchors = growthStudy.samples.find(sample => sample.id === "sori")!.anchors;
const sample: Sample = {
  ...sori,
  outputs: { bone: { ...sori.outputs.bone, path: "os/home/imprint-art/bone" } },
  coordinates: { ...sori.coordinates, path: "os/home/imprint-art/coordinates" },
};

type Props = { days: ImprintDay[]; pulses: WritingImprintPulse[] };

export default function WritingImprintReview({ days, pulses }: Props) {
  const [clock, setClock] = useState(() => Date.now());
  const contributions = useMemo(() => writingImprintContributions(days, clock), [days, clock]);
  const growth = useMemo(() => growthFromContributions(contributions), [contributions]);
  const animations = useMemo(() => pulses.map(({ group, serial, sources }) => {
    const newSources = new Set(sources);
    const previous = contributions.filter(day => day.group === group && day.sources.some(source => !newSources.has(source)));
    return { group, serial, previous: growthFromContributions(previous)[group] };
  }), [contributions, pulses]);

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

  return <ActivityCanvas sample={sample} anchors={anchors} growth={growth} pulses={animations} retainScene />;
}
