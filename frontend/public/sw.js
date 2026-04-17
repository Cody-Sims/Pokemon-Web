// Service Worker v3 — enhanced caching for offline play
const CACHE_VERSION = 3;
const CACHE_NAME = `pokemon-web-v${CACHE_VERSION}`;

// Core assets to precache at install — enough for the starter area to work offline
const PRECACHE_URLS = [
  '/Pokemon-Web/',
  '/Pokemon-Web/index.html',
  '/Pokemon-Web/assets/sprites/player/player.json',
  '/Pokemon-Web/assets/sprites/player/player.png',
  '/Pokemon-Web/assets/tilesets/overworld-tileset.png',
  '/Pokemon-Web/assets/maps/pallet-town.json',
  '/Pokemon-Web/assets/ui/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // HTML: network-first (always get latest)
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || offlineFallback()))
    );
    return;
  }

  // Game assets (sprites, tilesets, maps, audio, fonts): cache-first with background revalidation
  const isGameAsset = url.pathname.includes('/assets/');
  if (isGameAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        // Return cached immediately, but also fetch fresh copy in background
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // All other (JS bundles, CSS): stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

function offlineFallback() {
  return new Response(
    '<html><body style="background:#0f0f1a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1>🎮 Pokemon Web</h1><p>You are offline. Please connect to the internet and refresh.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
