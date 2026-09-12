// MedLadder — minimal service worker
// Purpose: satisfy PWA installability checks (PWABuilder/TWA) and cache the app shell.
// This does NOT cache Supabase/Razorpay API calls — those always go to the network.

const CACHE_NAME = 'medladder-v3-phase3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept cross-origin calls (Supabase, Razorpay, CDN scripts) —
  // let those always hit the network normally.
  if (url.origin !== self.location.origin) return;

  // Network-first for the HTML shell so users always get the latest app version;
  // fall back to cache when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for static shell assets.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
