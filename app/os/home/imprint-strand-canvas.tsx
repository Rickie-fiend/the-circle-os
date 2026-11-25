"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getAccountScope } from "../account-scope";
import type { WritingImprintPulse } from "../writing-provider";
import { activityPulse, PULSE_MS } from "./imprint-activity-model.js";
import { checkedArtwork, decodeArtwork, type ArtworkAsset } from "./imprint-artwork";
import { strandPaint, type StrandGroups } from "./imprint-strand-growth.js";
import { decodeStrandMap, renderStrandFrame, strandGroupIndices, type StrandMap } from "./imprint-strand-raster.js";
import type { ImprintDay } from "./imprint-writing-activity";

type Variant = { width: number; height: number; bone: ArtworkAsset; coordinates: ArtworkAsset };
type Scene = { art: ImageData; map: StrandMap };
type Props = {
  variants: readonly Variant[];
  groups: StrandGroups;
  days: ImprintDay[];
  clock: number;
  revision: number;
  claimPulses: () => WritingImprintPulse[];
};

const RISE_MS = 500;
const scenes = new Map<string, Promise<Scene>>();
// A frame contains private activity. A new account scope has a new abort signal.
const restingFrames = new WeakMap<AbortSignal, ImageData>();

function loadScene(variant: Variant) {
  const key = variant.bone.hash + variant.coordinates.hash;
  let pending = scenes.get(key);
  if (pending) return pending;
  pending = Promise.all([
    checkedArtwork(variant.bone).then(bytes => decodeArtwork(bytes, variant.bone.type ?? "image/webp")),
    checkedArtwork(variant.coordinates).then(bytes => {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).arrayBuffer();
    }),
  ]).then(([art, bytes]) => {
    if (art.width !== variant.width || art.height !== variant.height) throw Error("Artwork size is incomplete.");
    return { art, map: decodeStrandMap(bytes, art.width, art.height) };
  }).catch(error => {
    scenes.delete(key);
    throw error;
  });
  scenes.set(key, pending);
  return pending;
}

function putFull(context: CanvasRenderingContext2D, image: ImageData) {
  const canvas = context.canvas;
  if (canvas.width !== image.width || canvas.height !== image.height) {
    canvas.width = image.width;
    canvas.height = image.height;
  }
  context.putImageData(image, 0, 0);
}

function movingPixels(before: Uint8ClampedArray, peak: Uint8ClampedArray, rest: Uint8ClampedArray, width: number, height: number) {
  const indices = new Uint32Array(width * height);
  let count = 0, left = width, top = height, right = 0, bottom = 0;
  for (let i = 0; i < before.length; i += 4) {
    const differs = before[i] !== peak[i] || before[i + 1] !== peak[i + 1] || before[i + 2] !== peak[i + 2] ||
      rest[i] !== peak[i] || rest[i + 1] !== peak[i + 1] || rest[i + 2] !== peak[i + 2];
    if (!differs) continue;
    indices[count++] = i;
    const pixel = i / 4, x = pixel % width, y = Math.floor(pixel / width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return { indices: indices.subarray(0, count), left, top, width: right - left + 1, height: bottom - top + 1 };
}

export function StrandCanvas({ variants, groups, days, clock, revision, claimPulses }: Props) {
  const element = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [colorFailed, setColorFailed] = useState(false);

  useEffect(() => {
    const [high, low] = variants;
    const request = window.devicePixelRatio > 1 ? loadScene(high).catch(() => loadScene(low)) : loadScene(low);
    let active = true;
    void request.then(value => { if (active) setScene(value); }).catch(() => { if (active) setColorFailed(true); });
    return () => { active = false; };
  }, [variants]);

  useLayoutEffect(() => {
    const frame = restingFrames.get(getAccountScope().signal);
    const context = element.current?.getContext("2d");
    if (frame && context) putFull(context, frame);
  }, []);

  useLayoutEffect(() => {
    const target = element.current;
    const drawing = target?.getContext("2d");
    if (!scene || !target || !drawing) return;
    const canvas = target, context = drawing;
    const { signal } = getAccountScope();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const layer = canvas.closest(".os-route-layer");
    const { art: { data, width, height }, map } = scene;
    let request = 0;

    function queue(draw: FrameRequestCallback) {
      request = requestAnimationFrame(draw);
    }

    function begin() {
      request = 0;
      if (signal.aborted || document.visibilityState !== "visible") return;
      if (layer?.closest('[aria-hidden="true"]') || document.documentElement.dataset.osRouteTransition === "native" ||
          layer?.getAnimations().some(animation => animation.playState === "running")) {
        queue(begin);
        return;
      }
      const events = claimPulses();
      const now = Math.max(clock, Date.now());
      const current = strandPaint(groups, days, now);
      const index = strandGroupIndices(groups);
      const rest = renderStrandFrame(data, map, current, index);
      const settled = new ImageData(rest, width, height);
      const finish = () => {
        putFull(context, settled);
        restingFrames.set(signal, settled);
        canvas.dataset.ready = "true";
        canvas.dataset.pulsing = "false";
        delete canvas.dataset.pulseGroups;
      };
      if (motion.matches || !events.length || !current.hasColor) {
        finish();
        return;
      }
      const names = new Set(events.map(({ group }) => group as ImprintDay["group"]));
      const sources = new Set(events.flatMap(event => event.sources));
      const before = renderStrandFrame(data, map, strandPaint(groups, days, now, sources), index);
      const peak = renderStrandFrame(data, map, current, index, names);
      const moved = movingPixels(before, peak, rest, width, height);
      if (!moved.indices.length) {
        finish();
        return;
      }
      const image = new ImageData(new Uint8ClampedArray(before), width, height);
      putFull(context, image);
      restingFrames.set(signal, settled);
      canvas.dataset.ready = "true";
      canvas.dataset.pulsing = "true";
      canvas.dataset.pulseGroups = [...names].sort().join(" ");
      const start = performance.now();
      function draw(time: number) {
        const elapsed = time - start;
        if (signal.aborted) return;
        if (elapsed >= PULSE_MS || motion.matches) {
          finish();
          return;
        }
        const level = activityPulse(Math.max(0, elapsed), 0, RISE_MS);
        const origin = elapsed < RISE_MS ? before : rest;
        for (const i of moved.indices) {
          image.data[i] = origin[i] + (peak[i] - origin[i]) * level;
          image.data[i + 1] = origin[i + 1] + (peak[i + 1] - origin[i + 1]) * level;
          image.data[i + 2] = origin[i + 2] + (peak[i + 2] - origin[i + 2]) * level;
        }
        context.putImageData(image, 0, 0, moved.left, moved.top, moved.width, moved.height);
        queue(draw);
      }
      queue(draw);
    }

    const resume = () => { if (!request && document.visibilityState === "visible") queue(begin); };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [scene, days, groups, clock, revision, claimPulses]);

  return <>
    <canvas ref={element} width={390} height={585} className="imprint-loop-reference" role="img" aria-label="Activity colors on the accepted shape" />
    {colorFailed && <p className="imprint-home-error" role="alert">Artwork color is unavailable.</p>}
  </>;
}
