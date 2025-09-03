const CACHE_NAME = "simisa-cache-v1";
const OFFLINE_URL = "index.html";

// Add more files if needed (CSS, JS, images, etc.)
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

// Fetch requests
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    )
  );
});
