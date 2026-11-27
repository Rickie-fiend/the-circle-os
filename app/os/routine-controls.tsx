"use client";

import type { ButtonHTMLAttributes } from "react";

export function RoutineHeaderButton({ children, onClick, reflectionDirection, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { reflectionDirection?: "back" | "forward" }) {
  const isBack = children === "Back";

  function reflect(button: HTMLButtonElement) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const text = button.querySelector("span");
    if (!text) return;
    text.getAnimations().forEach((animation) => animation.cancel());
    const back = reflectionDirection ? reflectionDirection === "back" : isBack;
    text.animate([
      { backgroundPosition: back ? "0% 0px" : "100% 0px" },
      { backgroundPosition: back ? "100% 0px" : "0% 0px" },
    ], { duration: 240, easing: "ease-out" });
  }
  return <button {...props} type="button"
    aria-label={props["aria-label"] ?? (isBack ? "Back" : undefined)}
    onPointerDown={(event) => reflect(event.currentTarget)}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") reflect(event.currentTarget); }}
    onClick={(event) => { if (event.detail === 0) reflect(event.currentTarget); onClick?.(event); }}
  ><span className={isBack ? "os-routine-nav-text os-routine-back-icon" : "os-routine-nav-text"} aria-hidden={isBack || undefined}>{isBack ? "←" : children}</span></button>;
}

export function RoutineSwipeCue({ back = false, label = back ? "Routine" : "Protocol", onClick }: { back?: boolean; label?: string; onClick: () => void }) {
  return <div className={`os-routine-swipe-cue${back ? " is-back" : ""}`}>
    <button type="button" onClick={onClick} aria-label={`Open ${label}`}>
      {back && <span aria-hidden="true">‹</span>}{label}{!back && <span aria-hidden="true">›</span>}
    </button>
  </div>;
}
