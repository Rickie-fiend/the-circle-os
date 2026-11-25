"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { WritingContextValue } from "../writing-provider";
import type { ImprintDay } from "./imprint-writing-activity";
import variants from "./imprint-art-variants.json";
import "./imprint.css";

const WritingImprintReview = dynamic(() => import("./imprint-writing-review"));
const plain = variants[1].bone;
type ImprintActivity = NonNullable<WritingContextValue["imprint"]>;

export function ImprintBackground({ view, days, pulseRevision, takePulses, local }: ImprintActivity & {
  view: "home" | "today" | "reflect";
  local: { days: ImprintDay[]; takePulses: ImprintActivity["takePulses"] };
}) {
  const { days: localDays, takePulses: takeLocalPulses } = local;
  const allDays = useMemo(() => [...days, ...localDays], [days, localDays]);
  const [plainFailed, setPlainFailed] = useState(false);
  const claimPulses = useCallback(() => {
    if (view !== "home" || document.visibilityState !== "visible") return [];
    const activeSources = new Set(allDays.flatMap(day => day.sources));
    return [...takePulses(activeSources), ...takeLocalPulses(activeSources)];
  }, [allDays, view, takePulses, takeLocalPulses]);

  return <div className="os-imprint-background" data-imprint-view={view} aria-hidden={view !== "home" || undefined}>
    <div className="imprint-home-art">
      {plainFailed ? null :
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/${plain.path}?v=${plain.hash}`} width={390} height={585} alt="" onError={() => setPlainFailed(true)} />}
      <WritingImprintReview days={allDays} revision={pulseRevision} claimPulses={claimPulses} />
    </div>
  </div>;
}
