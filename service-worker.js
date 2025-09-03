const CACHE_NAME = 'simisa-v1';
const urlsToCache = [
  'index.html',
  // Add other assets like your CSS, JS, and image files
  './path/to/your.css',
  './path/to/your.js',
  './path/to/your-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});