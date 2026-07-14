const CACHE_NAME = 'azulink-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/catalogue',
  '/hors-connexion',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for pages, falling back to cache when offline.
// Successful GET responses are cached progressively so pages the
// traveler visits (offer details, categories...) become available offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, copy);
          }
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/hors-connexion'))
      )
  );
});
