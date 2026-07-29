"use client";

import { useEffect } from "react";

export function CircleOSPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/os-sw.js", { scope: "/os/" });
    }
  }, []);
  return null;
}
