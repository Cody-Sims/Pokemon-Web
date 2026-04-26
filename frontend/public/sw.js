// Service Worker v4 — full precache manifest + runtime caching strategies
// The __PRECACHE_MANIFEST__ and __RUNTIME_URLS__ tokens are replaced at build
// time by vite-plugin-sw-manifest. During development the SW falls back to
// network-only so it doesn't interfere with HMR.

const CACHE_VERSION = 4;
const CACHE_NAME = `pokemon-web-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `pokemon-web-runtime-v${CACHE_VERSION}`;

// ── Precache manifest (injected at build time) ──
// In development this stays as the placeholder string and triggers the
// fallback empty-array path below.
let PRECACHE_URLS;
try {
  PRECACHE_URLS = '__PRECACHE_MANIFEST__';
} catch (_) {
  PRECACHE_URLS = [];
}
if (typeof PRECACHE_URLS === 'string') {
  // Build-time replacement didn't happen (dev mode) — precache nothing
  PRECACHE_URLS = [
    '/Pokemon-Web/',
    '/Pokemon-Web/index.html',
  ];
}

// ── Runtime-cache hints (injected at build time) ──
let RUNTIME_URLS;
try {
  RUNTIME_URLS = '__RUNTIME_URLS__';
} catch (_) {
  RUNTIME_URLS = [];
}
if (typeof RUNTIME_URLS === 'string') {
  RUNTIME_URLS = [];
}

// Maximum individual asset size we'll cache at runtime (10 MB — covers Phaser)
const MAX_RUNTIME_CACHE_SIZE = 10 * 1024 * 1024;
// Maximum number of entries in the runtime cache
const MAX_RUNTIME_ENTRIES = 500;

// ─────────────────────────── Install ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll is atomic — if any request fails, none are cached.
      // Use individual puts for resilience.
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response.ok) return cache.put(url, response);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to precache: ${url}`, err);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// ─────────────────────────── Activate ──────────────────────────
self.addEventListener('activate', (event) => {
  // Purge all old caches (both precache and runtime)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─────────────────────────── Fetch ─────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // HTML navigation: network-first with offline fallback
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
    return;
  }

  // Hashed JS/CSS bundles (e.g. index-abc123.js): cache-first (immutable)
  if (isHashedAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request, CACHE_NAME));
    return;
  }

  // Game assets (sprites, tilesets, maps, audio, fonts): stale-while-revalidate
  if (isGameAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request, RUNTIME_CACHE));
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(staleWhileRevalidateStrategy(event.request, CACHE_NAME));
});

// ─────────────────── Caching strategies ────────────────────────

/** Network-first: try network, fall back to cache, then offline page */
function networkFirstStrategy(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || offlineFallback())
    );
}

/** Cache-first: serve from cache, only fetch if not cached */
function cacheFirstStrategy(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

/** Stale-while-revalidate: return cache immediately, update in background */
function staleWhileRevalidateStrategy(request, cacheName) {
  return caches.open(cacheName).then((cache) => {
    return cache.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            // Only cache if within size limit
            const contentLength = response.headers.get('content-length');
            if (!contentLength || parseInt(contentLength, 10) <= MAX_RUNTIME_CACHE_SIZE) {
              cache.put(request, response.clone());
            }
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    });
  });
}

// ─────────────────────── Helpers ───────────────────────────────

/** Check if the path looks like a Vite hashed asset (e.g. /assets/index-abc12345.js) */
function isHashedAsset(pathname) {
  return /\/assets\/[^/]+-[a-zA-Z0-9]{8,}\.(js|css)$/.test(pathname);
}

/** Check if the path is a game asset (images, audio, maps, fonts) */
function isGameAsset(pathname) {
  return pathname.includes('/assets/');
}

/** Offline fallback HTML page */
function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pokemon Aurum — Offline</title>
<style>
  body { background:#0f0f1a; color:#fff; font-family:'Courier New',monospace;
         display:flex; align-items:center; justify-content:center; height:100vh;
         margin:0; text-align:center; }
  h1 { color:#ffcc00; margin-bottom:12px; }
  p { color:#aaa; max-width:320px; line-height:1.5; }
  button { margin-top:16px; padding:10px 24px; background:transparent;
           border:1px solid #ffcc00; color:#ffcc00; font-family:inherit;
           font-size:14px; border-radius:6px; cursor:pointer; }
  button:active { background:rgba(255,204,0,0.15); }
</style></head>
<body><div>
  <h1>Pokemon Aurum</h1>
  <p>You are offline. Please connect to the internet and try again.</p>
  <button onclick="location.reload()">Retry</button>
</div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// ─────────────── Periodic runtime cache cleanup ────────────────
// Trim runtime cache if it grows too large
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIM_CACHES') {
    trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
  }
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries (FIFO)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}
