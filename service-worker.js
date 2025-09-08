// service-worker.js
const CACHE_NAME = "simisa-cache-v5";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./app.js",
  "./fallback.js",
  "./jspdf.umd.min.js",
  "./jspdf.plugin.autotable.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: cache app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: offline-first with fallback
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // return cache if available
      if (response) return response;

      // else fetch and cache new requests
      return fetch(event.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === "opaque") {
            return res;
          }
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => {
          // fallback to cached index.html for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
