"use client";
/* eslint-disable @next/next/no-img-element -- This isolated Vite review compares the exact exported assets without image optimization. */

import { useEffect, useState } from "react";
import { createImprintRecipe, retainImprintRecipe, type DrawingRecipe } from "./imprint-model.js";
import { PersonalImprint, type ImprintColors } from "./personal-imprint";
import { createPersonalImprintRecipe, retainPersonalImprintRecipe, type PersonalImprintRecipe } from "./imprint-personal-recipe.js";
import { personalImprintSamples, reorderSampleInput, correctedSampleInput } from "./imprint-personal-samples.js";
import { createLoopImprintRecipe, retainLoopImprintRecipe, type LoopImprintRecipe } from "./imprint-loop-recipe.js";
import { loopImprintSamples } from "./imprint-loop-samples.js";
import ImprintGeneratorPreview from "./imprint-generator-preview";
import ImprintColorPreview from "./imprint-color-preview";
import ImprintGrowthPreview from "./imprint-growth-preview";
import ImprintActivityPreview from "./imprint-activity-preview";

const samples = [
  { name: "Synthetic A", birthday: "1994-03-12", answers: { situation: ["study"], experience: "making something", wanted: "learn", habit: "Read one page", wake: "07:00", bed: "23:00" } },
  { name: "Synthetic B", birthday: "1987-11-06", answers: { situation: ["work", "care"], experience: "helping someone", wanted: "direction", habit: "Walk", wake: "06:30", bed: "22:30" } },
  { name: "Synthetic C", birthday: "2001-08-21", answers: { situation: ["work"], experience: "learning a skill", wanted: "relationships", habit: "Push-ups", wake: "08:00", bed: "00:00" } },
];

// Review harness only: no personal stores, routes, completion actions or writes.
export default function ImprintPreview() {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "activity") return <ImprintActivityPreview />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "growth") return <ImprintGrowthPreview />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "color") return <ImprintColorPreview />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "generator") return <ImprintGeneratorPreview />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "sori-depth") return <SoriDepthStudy />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "sori") return <SoriStudy />;
  // The previous controls remain available for their recorded behavioral checks.
  // The default compares bounded personal forms; earlier construction stays linked.
  const previous = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "previous";
  const master = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "master";
  const geometry = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "geometry";
  const material = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "material";
  const personal = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "personal";
  return previous ? <PreviousImprintStudy /> : master ? <VectorMasterStudy /> : geometry ? <NetworkStudy /> : material ? <MaterialStudy /> : personal ? <PersonalFormStudy /> : <LoopSculptureStudy />;
}

type LoopStudyReport = {
  version: number; readyForReview: boolean;
  samples: { id: string; label: string; status: string; recipe: LoopImprintRecipe; recipeHash: string; geometryHash: string; renderHash: string; inspection: { majorHoles: number }; outputs: Record<string, { path: string; hash: string }> }[];
};

type SoriDepthReport = { readyForReview: boolean; outputs: Record<string, { path: string; hash: string }> };

function SoriDepthStudy() {
  const [report, setReport] = useState<SoriDepthReport | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/docs/design/personal-imprint-sori-v4-inspection.json', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw Error(); return response.json(); })
      .then(setReport).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  const asset = (name: string) => report ? `/${report.outputs[name].path}?v=${report.outputs[name].hash}` : '';
  return <main className="imprint-study">
    <p>Sori · rounded ridges and valleys</p>
    <p role="status">{error ? 'Inspection unavailable. Refresh to try again.' : !report ? 'Loading inspection…' : report.readyForReview ? 'Construction checks complete · visual review pending' : 'This relief candidate needs further work.'}</p>
    {report?.readyForReview ? <>
      <div className="imprint-master-comparison">
        <figure><figcaption>Before relief</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-sori-v3-full.png" alt="Sori before bundle relief" /></figure>
        <figure><figcaption>Ridges and valleys</figcaption><img className="imprint-master-image" src={asset('full')} alt="Sori with rounded bundle relief" /><p><a href={asset('390')}>Phone image</a> · <a href={asset('crown')}>Crown detail</a> · <a href={asset('lower')}>Lower detail</a></p></figure>
        <figure><figcaption>Original reference</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Original thread sculpture reference" /></figure>
      </div>
      <details><summary>Inspect the depth</summary><div className="imprint-master-comparison">
        <figure><figcaption>Angled view · 15 degrees</figcaption><img className="imprint-master-image" src={asset('angled')} alt="Sori relief from an angled view" /></figure>
        <figure><figcaption>Depth · lighter is nearer</figcaption><img className="imprint-master-image" src={asset('depth')} alt="Sori guide depth diagnostic" /></figure>
      </div></details>
      <p><a href={asset('overlaps')}>Numbered overlaps</a> · <a href={asset('loops')}>Three complete strands</a></p>
    </> : null}
    <p><a href="?study=sori">Earlier Sori comparison</a> · <a href="?">Six original forms</a></p>
  </main>;
}

function SoriStudy() {
 const [state,setState]=useState<string>("Loading inspection…");
 useEffect(()=>{const controller=new AbortController();fetch('/docs/design/personal-imprint-sori-v3-inspection.json',{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(r=>setState(r.readyForReview?'Construction checks complete · visual acceptance pending':'Candidate needs further work')).catch(()=>{if(!controller.signal.aborted)setState('Inspection unavailable. Refresh to try again.');});return()=>controller.abort();},[]);
 return <main className="imprint-study"><p>Sori · smaller openings and layered folds</p><p role="status">{state}</p><div className="imprint-master-comparison">
 {[["Current Sori","personal-imprint-loops-v2-sori"],["Revised Sori","personal-imprint-sori-v3"]].map(([label,base])=><figure key={base}><figcaption>{label}</figcaption><img className="imprint-master-image" src={`/docs/design/${base}-full.png`} alt={label}/><p><a href={`/docs/design/${base}-390.png`}>Phone image</a> · <a href={`/docs/design/${base}-crown.png`}>Detail</a></p></figure>)}
 <figure><figcaption>Original reference</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Original thread sculpture reference"/></figure></div><p><a href="/docs/design/personal-imprint-sori-v3-overlaps.png">Numbered overlaps</a> · <a href="/docs/design/personal-imprint-sori-v3-loops.svg">Three complete strands</a> · <a href="/docs/design/personal-imprint-sori-v3-silhouette.png">Silhouette</a> · <a href="?">Six original forms</a></p></main>;
}
type ReviewLoop = { id: string; route: number[][] };

function LoopSculptureStudy() {
  const [report, setReport] = useState<LoopStudyReport | null>(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<"threads" | "silhouette">("threads");
  const [selected, setSelected] = useState(loopImprintSamples[0].id);
  const [loops, setLoops] = useState<ReviewLoop[] | null>(null);
  const [loopError, setLoopError] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  const [oblique, setOblique] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Choose a check for this fictional profile.");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/docs/design/personal-imprint-loops-v2-inspection.json", { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(data => { if (data.version !== 2 || !Array.isArray(data.samples)) throw new Error("Unavailable"); setReport(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  const selectedRecord = report?.samples.find(s => s.id === selected);
  const selectedAsset = selectedRecord?.status === "rendered" ? selectedRecord.outputs.selected : undefined;
  useEffect(() => {
    setLoops(null); setLoopError(false); setLoopIndex(0);
    if (!selectedAsset) return;
    const controller = new AbortController();
    fetch(`/${selectedAsset.path}?v=${selectedAsset.hash}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(setLoops).catch(() => { if (!controller.signal.aborted) setLoopError(true); });
    return () => controller.abort();
  }, [selectedAsset]);
  async function check(action: "repeat" | "reorder" | "correct" | "missing") {
    const fixture = loopImprintSamples.find(s => s.id === selected), saved = selectedRecord?.recipe;
    if (!fixture || !saved) return;
    setBusy(true);
    try {
      const generated = action === "correct" ? await retainLoopImprintRecipe(saved, correctedSampleInput(fixture.input))
        : await createLoopImprintRecipe(action === "reorder" ? reorderSampleInput(fixture.input) : action === "missing" ? { ...fixture.input, name: "" } : fixture.input);
      if (JSON.stringify(generated) !== JSON.stringify(saved)) throw new Error("This form changed unexpectedly. Its recipe needs review.");
      setMessage(action === "correct" ? "Profile correction kept the original sculpture. No profile changes were saved." : action === "reorder" ? "Reordered answers kept the same sculpture." : "Repeated answers kept the same sculpture.");
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "The sample could not be checked."); }
    finally { setBusy(false); }
  }
  let path = "";
  const activeLoop = loops?.[loopIndex];
  if (activeLoop) {
    const centerZ = activeLoop.route.reduce((sum, p) => sum + p[2], 0) / activeLoop.route.length;
    const points = activeLoop.route.map(p => [oblique ? 512 + (p[0] - 512) * Math.SQRT1_2 + (p[2] - centerZ) * Math.SQRT1_2 : p[0], p[1]]);
    const bounds = points.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
    const scale = Math.min(900 / (bounds[2] - bounds[0]), 1352 / (bounds[3] - bounds[1]));
    path = points.map((p, i) => `${i ? "L" : "M"}${(512 + (p[0] - (bounds[0] + bounds[2]) / 2) * scale).toFixed(3)} ${(768 + (p[1] - (bounds[1] + bounds[3]) / 2) * scale).toFixed(3)}`).join(" ") + " Z";
  }
  return <main className="imprint-study">
    <p>Personal Imprint · closed-loop sculpture study</p>
    <p>Six fictional profiles · 128 closed strands each · {report?.readyForReview ? "checks complete, visual review pending" : "inspection in progress"}</p>
    {report ? <>
      <div className="imprint-study-controls" aria-label="Comparison view">
        <button aria-pressed={mode === "threads"} onClick={() => setMode("threads")}>Thread forms</button>
        <button aria-pressed={mode === "silhouette"} onClick={() => setMode("silhouette")}>Silhouettes</button>
      </div>
      <div className="imprint-personal-grid imprint-loop-grid" aria-label="Closed-loop sculpture comparison">
        {report.samples.map(sample => <figure key={sample.id}>
          <figcaption>{sample.label}<span>{sample.inspection.majorHoles} main {sample.inspection.majorHoles === 1 ? "opening" : "openings"}</span></figcaption>
          {sample.status === "rendered" ? <>
            <img className="imprint-master-image" src={`/${sample.outputs[mode === "threads" ? "full" : "silhouette"].path}?v=${sample.outputs[mode === "threads" ? "full" : "silhouette"].hash}`} alt={`${sample.label}'s ${mode === "threads" ? "closed-loop sculpture" : "silhouette"}`} />
            <p><a href={`/${sample.outputs["390"].path}?v=${sample.outputs["390"].hash}`}>Phone image</a>{" · "}<a href={`/${sample.outputs.crown.path}?v=${sample.outputs.crown.hash}`}>Detail</a></p>
          </> : <p>This construction needs review before it can be shown.</p>}
        </figure>)}
      </div>
      <details><summary>Original reference style</summary><img className="imprint-loop-reference" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Original thread sculpture style reference" /></details>
      <div className="imprint-personal-checks">
        <label htmlFor="loop-profile">Choose a fictional profile</label>
        <select id="loop-profile" value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setMessage("Choose a check for this fictional profile."); }}>
          {loopImprintSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}
        </select>
        <div className="imprint-study-controls">
          <button disabled={busy} onClick={() => void check("repeat")}>Repeat answers</button>
          <button disabled={busy} onClick={() => void check("reorder")}>Reorder answers</button>
          <button disabled={busy} onClick={() => void check("correct")}>Correct profile</button>
          <button disabled={busy} onClick={() => void check("missing")}>Try missing name</button>
        </div>
        <p role="status" aria-live="polite">{busy ? "Checking…" : message}</p>
        <p>Follow one complete strand, including its hidden return.</p>
        {loops ? <>
          <label htmlFor="review-loop">Choose a strand</label>
          <select id="review-loop" value={loopIndex} onChange={event => setLoopIndex(Number(event.target.value))}>{loops.map((loop, index) => <option key={loop.id} value={index}>{loop.id}</option>)}</select>
          <div className="imprint-study-controls"><button aria-pressed={!oblique} onClick={() => setOblique(false)}>Front view</button><button aria-pressed={oblique} onClick={() => setOblique(true)}>Angled view</button></div>
          <svg className="imprint-loop-trace" viewBox="0 0 1024 1536" role="img" aria-label={`Complete ${activeLoop?.id}, ${oblique ? "angled" : "front"} view`}><path d={path} fill="none" stroke="#f1efe8" strokeWidth="2.5" /></svg>
        </> : <p>{selectedRecord?.status !== "rendered" ? "Strand inspection will be available after construction checks pass." : loopError ? "The strand view is unavailable. Refresh to try again." : "Loading the strand view…"}</p>}
      </div>
    </> : <p role="status">{error ? "The loop study is not ready. Render and inspect it, then refresh." : "Loading the loop study…"}</p>}
    <p><a href="?study=personal">Earlier variations</a>{" · "}<a href="?study=material">Earlier material study</a>{" · "}<a href="?study=geometry">Earlier geometry</a></p>
  </main>;
}

type PersonalStudyReport = {
  readyForReview: boolean;
  status: string;
  baseline: { path: string; hash: string };
  samples: { id: string; label: string; description: string; status: string; recipe: PersonalImprintRecipe; renderHash?: string; outputs?: Record<string, { path: string; hash: string }> }[];
};

function PersonalFormStudy() {
  const [report, setReport] = useState<PersonalStudyReport | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(personalImprintSamples[0].id);
  const [message, setMessage] = useState("Choose a sample to check its original form.");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/docs/design/personal-imprint-personal-v1-inspection.json", { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(setReport).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  async function check(action: "repeat" | "reorder" | "correct" | "missing") {
    const sample = personalImprintSamples.find(s => s.id === selected);
    const saved = report?.samples.find(s => s.id === selected)?.recipe;
    if (!sample || !saved) return;
    setBusy(true);
    try {
      const generated = action === "correct" ? await retainPersonalImprintRecipe(saved, correctedSampleInput(sample.input))
        : await createPersonalImprintRecipe(action === "reorder" ? reorderSampleInput(sample.input) : action === "missing" ? { ...sample.input, name: "" } : sample.input);
      if (JSON.stringify(generated) !== JSON.stringify(saved)) throw new Error("The form changed unexpectedly. Inspect this sample before continuing.");
      setMessage(action === "correct" ? "Profile correction kept the original form. This demonstration saves no profile changes." : action === "reorder" ? "Reordered selections kept the same form." : "Repeated answers kept the same form.");
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "The sample could not be checked."); }
    finally { setBusy(false); }
  }
  return <main className="imprint-study">
    <p>Personal Imprint · personal-form prototype</p>
    <p>Three fictional people · one shared construction · {report?.readyForReview ? "checks complete, visual review pending" : "inspection in progress"}</p>
    {report ? <>
      <div className="imprint-personal-grid" aria-label="Personal form comparison">
        <figure><figcaption>Working master<span>Current visual baseline</span></figcaption><img className="imprint-master-image" src={`/${report.baseline.path}?v=${report.baseline.hash}`} alt="Working monochrome master before personal variation" /></figure>
        {report.samples.map(sample => <figure key={sample.id}>
          <figcaption>{sample.label}<span>{sample.description}</span></figcaption>
          {sample.status === "rendered" && sample.outputs ? <>
            <img className="imprint-master-image" src={`/${sample.outputs.full.path}?v=${sample.renderHash}`} alt={`${sample.label}'s fictional personal form`} />
            <p><a href={`/${sample.outputs["390"].path}?v=${sample.outputs["390"].hash}`}>Phone image</a>{" · "}<a href={`/${sample.outputs.shoulder.path}?v=${sample.outputs.shoulder.hash}`}>Shoulder detail</a></p>
          </> : <p>This variation is not ready. Its geometry needs review.</p>}
        </figure>)}
      </div>
      <p>All three keep the same folds and openings. Answers vary the form without measuring effort or worth. The working artwork retains cut-looking strand entries and less layered volume than the reference.</p>
      <div className="imprint-personal-checks">
        <label htmlFor="imprint-sample">Check a sample</label>
        <select id="imprint-sample" value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setMessage("Choose a check for this sample."); }}>
          {personalImprintSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}
        </select>
        <div className="imprint-study-controls">
          <button disabled={busy} onClick={() => void check("repeat")}>Repeat answers</button>
          <button disabled={busy} onClick={() => void check("reorder")}>Reorder selections</button>
          <button disabled={busy} onClick={() => void check("correct")}>Correct profile</button>
          <button disabled={busy} onClick={() => void check("missing")}>Try missing name</button>
        </div>
        <p role="status" aria-live="polite">{busy ? "Checking the sample…" : message}</p>
      </div>
    </> : <p role="status">{error ? "The personal-form study is not ready. Render and inspect the samples, then refresh." : "Loading the sample forms…"}</p>}
    <p><a href="?study=material">Material and reference comparison</a>{" · "}<a href="?study=geometry">Step 4 geometry</a></p>
  </main>;
}

type MaterialReport = {
  geometryHash: string;
  renderHash: string;
  readyForDeveloperReview: boolean;
  strands: { count: number };
  outputs: Record<string, { path: string; hash: string }>;
};

function MaterialStudy() {
  const [report, setReport] = useState<MaterialReport | null>(null);
  const [error, setError] = useState(false);
  const base = "/docs/design/personal-imprint-material-v1";
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}-inspection.json`, { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Material output unavailable"); return response.json(); })
      .then(setReport)
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return <main className="imprint-study">
    <p>Personal Imprint · Step 5 · material and light</p>
    {report ? <>
      <p>{report.strands.count} strands · {report.readyForDeveloperReview ? "Material checks complete · final visual review pending" : "Material inspection in progress"}</p>
      <div className="imprint-master-comparison">
        <figure><figcaption>Lit monochrome master</figcaption><img className="imprint-master-image" src={`${base}-full.png?v=${report.renderHash}`} alt="Monochrome strand sculpture with round fibres and upper-left lighting" /></figure>
        <figure><figcaption>Reference</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Thread sculpture reference" /></figure>
      </div>
      <p>Several strand entries still look cut from the front. The reference’s continuity and volume remain unaccepted.</p>
      <details><summary>Inspect material close-ups</summary><p>
        {["390", "crown", "shoulder", "lower", "shadows"].map(name => <a key={name} href={`${base}-${name}.png?v=${report.outputs[name].hash}`} style={{ color: "inherit", marginRight: 16 }}>{name === "390" ? "Phone size" : name}</a>)}
      </p></details>
      <p>Geometry {report.geometryHash.slice(0, 12)} · render {report.renderHash.slice(0, 12)}</p>
    </> : <p role="status">{error ? "Material output is not ready. Refresh after rendering and inspection finish." : "Loading material study…"}</p>}
    <p><a href="?study=geometry" style={{ color: "inherit" }}>Step 4 geometry and inspection views</a></p>
  </main>;
}

type NetworkReport = {
  geometryHash: string;
  renderHash: string;
  readyForStep5: boolean;
  surface: { coverage: number };
  strands: { count: number };
};

function NetworkStudy() {
  const [report, setReport] = useState<NetworkReport | null>(null);
  const [error, setError] = useState(false);
  const base = "/docs/design/personal-imprint-flow-network-v4";
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}-inspection.json`, { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Build output unavailable"); return response.json(); })
      .then(setReport)
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return <main className="imprint-study">
    <p>Personal Imprint · Step 4 · monochrome geometry</p>
    {report ? <>
      <p>{report.strands.count} complete strands · {(report.surface.coverage * 100).toFixed(2)}% material coverage · {report.readyForStep5 ? "Step 4 checks complete" : "Inspection in progress"}</p>
      <div className="imprint-master-comparison">
        <figure><figcaption>Current network</figcaption><img className="imprint-master-image" src={`${base}-full.png?v=${report.renderHash}`} alt="Current monochrome strand sculpture" /></figure>
        <figure><figcaption>Reference</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Thread sculpture reference" /></figure>
      </div>
      <p>Geometry {report.geometryHash.slice(0, 12)} · <a href="?study=material" style={{ color: "inherit" }}>View Step 5 material</a></p>
      <details><summary>Inspect geometry and close-ups</summary><p>
        {["surface", "coverage", "routes", "crown", "shoulder", "lower"].map(name => <a key={name} href={`${base}-${name}.png?v=${report.renderHash}`} style={{ color: "inherit", marginRight: 16 }}>{name}</a>)}
      </p></details>
    </> : <p>{error ? "Build output is not ready. Refresh after the geometry build finishes." : "Loading current geometry…"}</p>}
    <p><a href="?study=master" style={{ color: "inherit" }}>Earlier static masters</a></p>
  </main>;
}

function VectorMasterStudy() {
  return <main className="imprint-study">
    <p>Static vector master · monochrome · no onboarding variation</p>
    <div className="imprint-master-comparison">
      <figure><figcaption>Closed-route study v2 · visual review pending</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-continuous-master-v2.svg" alt="Monochrome thread study with closed parallel return routes" /></figure>
      <figure><figcaption>Previous continuous-path master v1</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-continuous-master-v1.svg" alt="Previous monochrome vector thread master" /></figure>
      <figure><figcaption>Reference</figcaption><img className="imprint-master-image" src="/docs/design/personal-imprint-thread-reference-v1.png" alt="Original thread artwork reference" /></figure>
    </div>
    <p><a href="/docs/design/personal-imprint-continuous-master-v2.svg" style={{ color: "inherit" }}>Open closed-route study v2</a>{" · "}<a href="/docs/design/personal-imprint-thread-master-v1.svg" style={{ color: "inherit" }}>Earlier traced master</a></p>
  </main>;
}

function PreviousImprintStudy() {
  const [sample, setSample] = useState(0);
  const [recipe, setRecipe] = useState<DrawingRecipe>(() => createImprintRecipe(samples[0]));
  const [colors, setColors] = useState<ImprintColors>({ starting: .15, notes: .1, routine: .25 });
  return <main className="imprint-study">
    <p>Synthetic artwork study · sample colors, no live records</p>
    <p><a href="/docs/design/personal-imprint-thread-reference-v1.png" style={{ color: "inherit" }}>View generated thread reference</a></p>
    <div className="imprint-study-art"><PersonalImprint recipe={recipe} colors={colors} /></div>
    <div className="imprint-study-controls" aria-label="Artwork review controls">
      {samples.map((_, index) => <button key={index} aria-pressed={sample === index} onClick={() => { setSample(index); setRecipe(createImprintRecipe(samples[index])); }}>Shape {index + 1}</button>)}
      <button onClick={() => setColors({})}>No Orange</button>
      <button onClick={() => setColors({ starting: .6 })}>Chapter complete</button>
      <button onClick={() => setColors({ "log-week": .6 })}>Complete from Week</button>
      <button onClick={() => setColors({ routine: .6 })}>Complete from Habits/Tasks</button>
      <button onClick={() => setColors({ starting: .35, notes: .5, thoughts: .3, routine: .6, "log-week": .4, protocol: .5 })}>Mixed activity</button>
      <button onClick={() => setRecipe(retainImprintRecipe(recipe, { ...samples[sample], name: "Corrected name", birthday: "1990-01-01" }))}>Correct profile, retain form</button>
    </div>
  </main>;
}
