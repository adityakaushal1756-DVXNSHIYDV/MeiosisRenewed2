/**
 * MEIOSIS Patient Console — Service Worker
 *
 * Strategy overview:
 *  - App shell (HTML / CSS / JS):  Cache-first on install, refresh in background
 *  - API calls (/api/*):           Network-first with cache fallback (stale data > blank screen)
 *  - Google Fonts:                 Cache-first (immutable after first load)
 *  - Everything else:              Network-first
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `meiosis-shell-${CACHE_VERSION}`;
const API_CACHE     = `meiosis-api-${CACHE_VERSION}`;
const FONT_CACHE    = `meiosis-fonts-${CACHE_VERSION}`;

// Pages and assets that make up the offline app shell
const SHELL_ASSETS = [
  '/patient.html',
  '/login.html',
  '/signup.html',
  '/styles.css',
  '/auth.css',
  '/app.js',
  '/auth.js',
  '/icon.svg',
  '/manifest.webmanifest',
];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [SHELL_CACHE, API_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // ── Google Fonts — Cache-first (font bytes never change once fetched) ──
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ── Backend API — Network-first with stale fallback ──
  if (url.pathname.startsWith('/api/') || url.port === '5002') {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // ── App shell & static assets — Cache-first ──
  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

// ─── Strategy helpers ───────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache immediately; if not cached, fetch and store.
 */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Return a simple offline page for HTML navigation requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const shell = await caches.match('/patient.html');
      if (shell) return shell;
    }
    return new Response('Offline — content not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Network-first: try the network with a timeout; fall back to cache.
 * @param {number} timeoutMs  milliseconds before giving up on network
 */
async function networkFirst(request, cacheName, timeoutMs = 5000) {
  const cache = await caches.open(cacheName);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );

  try {
    return await Promise.race([networkPromise, timeoutPromise]);
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ offline: true, message: 'You are offline. Showing cached data.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
