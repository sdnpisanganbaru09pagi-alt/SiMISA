const CACHE_NAME = "simisa-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install SW and cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Serve cached files when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
