const CACHE_NAME = "simisa-cache-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./app.js",
  "./jspdf.plugin.autotable.min.js",
  "./jspdf.umd.min.js"
];

// Pasang Service Worker dan cache file
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // segera aktifkan SW baru
});

// Aktivasi SW dan hapus cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim(); // ambil kontrol langsung
});

// Strategi fetch: network-first untuk file penting, cache-first untuk lainnya
self.addEventListener("fetch", event => {
  const { request } = event;

  // File yang sering berubah → gunakan network-first
  const isDynamic =
    request.url.endsWith("app.js") ||
    request.url.endsWith("style.css") ||
    request.url.endsWith("index.html");

  if (isDynamic) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Simpan versi terbaru di cache
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Jika gagal (offline), gunakan cache
          return caches.match(request);
        })
    );
  } else {
    // Default: cache-first
    event.respondWith(
      caches.match(request).then(resp => {
        return (
          resp ||
          fetch(request).then(response => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
              return response;
            });
          })
        );
      })
    );
  }
});
