// v6 keeps v5's network-first code updates and primes static files that loaded
// before the first worker was installed, so the next open can work offline.
const CACHE = "circle-os-v6";
const SHELL = [
  "/os",
  "/os/mirror",
  "/os/connect",
  "/circle-os.webmanifest?v=4",
  "/brand/circle-os-icon-180.png?v=4",
  "/brand/circle-os-icon-192.png?v=4",
  "/brand/circle-os-icon-512.png?v=4",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ).then(() => self.clients.claim()),
  );
});

// The first app load happens before installation. Prime only same-origin
// static resources, never evidence requests, login links, or auth responses.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_LOADED_ASSETS" || !Array.isArray(event.data.urls)) return;
  const urls = [...new Set(event.data.urls)].filter((value) => {
    try {
      const url = new URL(value);
      return url.origin === self.location.origin &&
        ["/_next/static/", "/assets/", "/fonts/", "/brand/"].some((prefix) => url.pathname.startsWith(prefix));
    } catch { return false; }
  });
  event.waitUntil(self.clients.claim().then(() => caches.open(CACHE)).then((cache) => Promise.allSettled(urls.map(async (url) => {
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) throw new Error("Static asset unavailable.");
    await cache.put(url, response);
  }))).then((results) => {
    event.ports[0]?.postMessage({ ready: urls.length > 0 && results.every((result) => result.status === "fulfilled") });
  }));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (
    event.request.mode === "navigate" &&
    url.pathname.startsWith("/os")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((response) => response || caches.match("/os")),
        ),
    );
    return;
  }

  if (!["script", "style", "font", "image"].includes(event.request.destination)) {
    return;
  }

  // Code goes to the network first; a font or an image may come from the cache.
  //
  // A stylesheet or a script decides what the app *is*, and serving a stale one
  // means shipping a fix that never arrives. A font or an image only decides
  // how it looks while it loads, and those are worth having instantly offline.
  // The cache still answers for code when the network cannot.
  const isCode = ["script", "style"].includes(event.request.destination);

  if (isCode) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }),
    ),
  );
});
