"use client";

import { useEffect } from "react";

export function CircleOSPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );
      return;
    }
    void navigator.serviceWorker
      .register("/os-sw.js", {
        scope: "/os",
        updateViaCache: "none",
      })
      .then(async (registration) => {
        await registration.update();
        const ready = await navigator.serviceWorker.ready;
        // On the first sign-in these files loaded before the worker existed.
        // Cache them now so the very next open can work without a connection.
        const urls = performance.getEntriesByType("resource")
          .filter((entry) => ["script", "link", "css"].includes((entry as PerformanceResourceTiming).initiatorType))
          .map((entry) => entry.name);
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data?.ready) document.documentElement.dataset.osOfflineReady = "true";
          channel.port1.close();
        };
        ready.active?.postMessage({ type: "CACHE_LOADED_ASSETS", urls }, [channel.port2]);
      }).catch(() => {
        // An installed shell can still open offline when an update check fails.
      });
  }, []);
  return null;
}
