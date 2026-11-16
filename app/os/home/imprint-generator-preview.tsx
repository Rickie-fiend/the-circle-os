"use client";
/* eslint-disable @next/next/no-img-element -- This review displays exact hash-bound renderer exports. */
import { useEffect, useState } from "react";
import { createReliefImprintRecipe, retainReliefImprintRecipe, type ReliefImprintRecipe } from "./imprint-relief-recipe.js";
import { reliefImprintSamples } from "./imprint-relief-samples.js";
import { reorderSampleInput, correctedSampleInput } from "./imprint-personal-samples.js";

type Asset = { path: string; hash: string };
type Sample = { id: string; label: string; status: string; recipe: ReliefImprintRecipe; outputs: Record<string, Asset> };
type Report = { readyForReview: boolean; samples: Sample[] };
type Strand = { id: string; route: number[][] };
const base = "/docs/design/personal-imprint-generator-v1";
const assetUrl = (asset: Asset) => `/${asset.path}?v=${asset.hash}`;

export default function ImprintGeneratorPreview() {
  const [report, setReport] = useState<Report | null>(null), [error, setError] = useState(false);
  const [mode, setMode] = useState("full"), [selected, setSelected] = useState("mira");
  const [strands, setStrands] = useState<Strand[] | null>(null), [strandError, setStrandError] = useState(false);
  const [strandIndex, setStrandIndex] = useState(0), [angled, setAngled] = useState(false);
  const [message, setMessage] = useState("Choose a check for this fictional profile."), [busy, setBusy] = useState(false);
  const record = report?.samples.find(sample => sample.id === selected);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}-inspection.json`, { cache: "no-store", signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error();
      return response.json();
    }).then(setReport).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (report?.readyForReview && record?.status === "verified") {
      fetch(assetUrl(record.outputs.selected), { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      }).then(setStrands).catch(() => { if (!controller.signal.aborted) setStrandError(true); });
    }
    return () => controller.abort();
  }, [report, record]);

  async function check(action: "repeat" | "reorder" | "correct" | "missing") {
    const sample = reliefImprintSamples.find(item => item.id === selected);
    if (!sample || !record) return;
    setBusy(true);
    try {
      const recipe = action === "correct" ? await retainReliefImprintRecipe(record.recipe, correctedSampleInput(sample.input))
        : await createReliefImprintRecipe(action === "reorder" ? reorderSampleInput(sample.input) : action === "missing" ? { ...sample.input, name: "" } : sample.input);
      const same = JSON.stringify(recipe) === JSON.stringify(record.recipe);
      setMessage(same ? action === "correct" ? "Profile correction kept the original sculpture." : action === "reorder" ? "Reordered answers kept the same sculpture." : "Repeated answers kept the same sculpture." : "The recipe changed and needs review.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "This form could not be checked."); }
    finally { setBusy(false); }
  }

  const strand = strands?.[strandIndex];
  let path = "";
  if (strand) {
    const meanDepth = strand.route.reduce((sum, point) => sum + point[2], 0) / strand.route.length;
    const points = strand.route.map(point => [angled ? 512 + (point[0] - 512) * Math.SQRT1_2 + (point[2] - meanDepth) * Math.SQRT1_2 : point[0], point[1]]);
    const bounds = points.reduce((box, point) => [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])], [Infinity, Infinity, -Infinity, -Infinity]);
    const scale = Math.min(900 / (bounds[2] - bounds[0]), 1352 / (bounds[3] - bounds[1]));
    path = points.map((point, index) => `${index ? "L" : "M"}${(512 + (point[0] - (bounds[0] + bounds[2]) / 2) * scale).toFixed(3)} ${(768 + (point[1] - (bounds[1] + bounds[3]) / 2) * scale).toFixed(3)}`).join(" ") + " Z";
  }
  const available = report?.readyForReview === true;
  return <main className="imprint-study">
    <p>Personal Imprint · rounded personal forms</p>
    <p role="status">{error ? "Inspection unavailable. Refresh to try again." : !report ? "Loading construction checks…" : !available ? "Construction needs further work before these forms can be shown." : "Construction checks complete · six fictional profiles · visual review pending"}</p>
    {available && <>
      <div className="imprint-study-controls" aria-label="Comparison view">
        {[["full", "Thread forms"], ["silhouette", "Silhouettes"], ["depth", "Depth"]].map(([value, label]) => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
      </div>
      <div className="imprint-personal-grid imprint-loop-grid" aria-label="Rounded form comparison">
        {report.samples.map(sample => <figure key={sample.id}>
          <figcaption>{sample.label}</figcaption>
          {sample.status === "verified" ? <>
            <img className="imprint-master-image" src={assetUrl(sample.outputs[mode])} alt={`${sample.label}'s rounded sculpture`} />
            <p><a href={assetUrl(sample.outputs["390"])}>Phone image</a>{" · "}<a href={assetUrl(sample.outputs.crown)}>Upper detail</a>{" · "}<a href={assetUrl(sample.outputs.lower)}>Lower detail</a></p>
          </> : <p>This construction needs review before it can be shown.</p>}
        </figure>)}
      </div>
      <details><summary>Accepted Sori v4</summary><img className="imprint-loop-reference" src="/docs/design/personal-imprint-sori-v4-390.png" alt="Accepted Sori v4 reference" /></details>
      <div className="imprint-personal-checks">
        <label htmlFor="rounded-profile">Choose a fictional profile</label>
        <select id="rounded-profile" value={selected} disabled={busy} onChange={event => {
          if (event.target.value === selected) return;
          setSelected(event.target.value); setStrands(null); setStrandError(false); setStrandIndex(0); setMessage("Choose a check for this fictional profile.");
        }}>{reliefImprintSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}</select>
        {record?.status === "verified" ? <>
          <div className="imprint-study-controls">
            {[["repeat", "Repeat answers"], ["reorder", "Reorder answers"], ["correct", "Correct profile"], ["missing", "Try missing name"]].map(([action, label]) => <button key={action} disabled={busy} onClick={() => void check(action as "repeat" | "reorder" | "correct" | "missing")}>{label}</button>)}
          </div>
          <p role="status" aria-live="polite">{busy ? "Checking…" : message}</p>
          <p>Follow a complete strand through its front and hidden return.</p>
          {strands ? <>
            <label htmlFor="rounded-strand">Choose a strand</label>
            <select id="rounded-strand" value={strandIndex} onChange={event => setStrandIndex(Number(event.target.value))}>{strands.map((item, index) => <option key={item.id} value={index}>{item.id}</option>)}</select>
            <div className="imprint-study-controls"><button aria-pressed={!angled} onClick={() => setAngled(false)}>Front view</button><button aria-pressed={angled} onClick={() => setAngled(true)}>Angled view</button></div>
            <svg className="imprint-loop-trace" viewBox="0 0 1024 1536" role="img" aria-label={`Complete ${strand?.id}, ${angled ? "angled" : "front"} view`}><path d={path} fill="none" stroke="#f1efe8" strokeWidth="2.5" /></svg>
          </> : <p>{strandError ? "The strand view is unavailable. Refresh to try again." : "Loading the strand view…"}</p>}
        </> : <p>Strand inspection is unavailable for this construction.</p>}
      </div>
    </>}
    <p><a href="?study=sori-depth">Accepted Sori comparison</a>{" · "}<a href="?">Six earlier forms</a></p>
  </main>;
}
