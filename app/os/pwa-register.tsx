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
        scope: "/os/",
        updateViaCache: "none",
      })
      .then((registration) => registration.update());
  }, []);
  return null;
}
