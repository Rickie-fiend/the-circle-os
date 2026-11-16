"use client";

import { useEffect, useRef } from "react";
import { imprintSegments, imprintThreads, IMPRINT_AREAS, type DrawingRecipe, type Point } from "./imprint-model.js";
import "./imprint.css";
import { makeFoldScene, paintFoldScene, type FoldScene } from "./imprint-folds.js";

export type ImprintRecipe = DrawingRecipe;
export type ImprintColors = Partial<Record<"starting" | "notes" | "thoughts" | "routine" | "log-week" | "protocol", number>>;

function traceThread(context: CanvasRenderingContext2D, points: Point[], continuePath = false) {
  if (continuePath) context.lineTo(...points[0]);
  else context.moveTo(...points[0]);
  for (let index = 1; index < points.length; index += 3) {
    context.bezierCurveTo(...points[index], ...points[index + 1], ...points[index + 2]);
  }
}

function drawThreads(context: CanvasRenderingContext2D, recipe: DrawingRecipe, colors: ImprintColors) {
  for (const bundle of imprintThreads(recipe)) {
    // Knock out the hidden rear bundles, leaving the holes genuinely open.
    // This background-colored silhouette supplies occlusion, not visible skin.
    context.beginPath();
    traceThread(context, bundle.outer);
    traceThread(context, [...bundle.inner].reverse(), true);
    context.closePath();
    context.fillStyle = "#191813";
    if (bundle.occlude) context.fill("evenodd");
    const amount = Math.max(0, Math.min(1, colors[bundle.area] || 0));
    for (const thread of bundle.threads) {
      const distance = Math.min(Math.abs(thread.u - bundle.accent), Math.abs(thread.u - bundle.accent - .19));
      const orange = amount > 0 ? Math.max(0, Math.min(1, (.012 + amount * .035 - distance) * 160)) * Math.min(1, amount * 2) : 0;
      const base = [241, 239, 232].map((value, index) => value * (1 - orange) + [227, 107, 55][index] * orange);
      const shade = (.3 + thread.light * .7) * thread.grain;
      const ink = (light: number) => `rgb(${base.map(value => Math.round(value * shade * light)).join(" ")})`;
      const from = thread.points[0], to = thread.points.at(-1)!;
      const gradient = context.createLinearGradient(...from, ...to);
      for (const t of [0, .25, .5, .75, 1]) {
        const light = .18 + .82 * Math.abs(Math.cos(thread.u * 2.4 + (bundle.lightPhase || 0) + t * .8)) ** .7;
        gradient.addColorStop(t, ink(light));
      }
      context.beginPath();
      traceThread(context, thread.points);
      context.strokeStyle = gradient;
      context.lineWidth = thread.width;
      context.stroke();
    }
  }
}

export function PersonalImprint({ recipe, colors = {} }: { recipe: ImprintRecipe; colors?: ImprintColors }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cachedScene = useRef<{ recipe: DrawingRecipe; scene: FoldScene } | null>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;
    const segments = recipe.version === 1 ? imprintSegments(recipe) : [];
    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(element.clientWidth * ratio);
      element.height = Math.round(element.clientHeight * ratio);
      context.setTransform(element.width / 520, 0, 0, element.height / 800, 0, 0);
      context.clearRect(0, 0, 520, 800);
      if (recipe.version === 3) {
        const existing = cachedScene.current;
        const scene = existing && existing.recipe === recipe && existing.scene.width === element.width && existing.scene.height === element.height
          ? existing.scene : makeFoldScene(recipe, element.width, element.height);
        cachedScene.current = { recipe, scene };
        paintFoldScene(context, scene, colors);
        return;
      }
      if (recipe.version === 2) {
        drawThreads(context, recipe, colors);
        return;
      }
      context.lineWidth = .65;
      context.lineCap = "round";
      for (const segment of segments) {
        const position = segment.t * 6 - .5;
        const left = Math.floor(position);
        const blend = (position - left) ** 2 * (3 - 2 * (position - left));
        const value = (index: number) => colors[IMPRINT_AREAS[Math.max(0, Math.min(5, index))] as keyof ImprintColors] || 0;
        const amount = Math.max(0, Math.min(1, value(left) * (1 - blend) + value(left + 1) * blend));
        const distance = Math.abs(segment.strand - .38);
        const orange = Math.max(0, Math.min(1, (amount * .22 - distance) * 45));
        const light = segment.points[4]?.light || .4;
        const base = [241, 239, 232].map((value, index) => value * (1 - orange) + [227, 107, 55][index] * orange);
        const shade = .18 + light * .82;
        context.beginPath();
        segment.points.forEach((point: { x: number; y: number }, index: number) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.lineWidth = .5;
        context.strokeStyle = `rgb(${base.map(value => Math.round(value * shade)).join(" ")})`;
        context.stroke();
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [recipe, colors]);
  return <canvas ref={canvas} className="personal-imprint" role="img" aria-label="Personal Imprint artwork. Progress is shown through Orange strands." />;
}
