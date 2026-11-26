/*
 * Samyak service worker — network first.
 *
 * The previous worker (cache 'samyak-cee-v2') answered every same-origin GET
 * from its cache first and refreshed in the background, so returning visitors
 * always saw the previous version of a page — new deploys looked like nothing
 * had changed. This one always asks the network first and only falls back to
 * the cache when the device is offline.
 *
 * Bumping CACHE_NAME deletes every older cache on activate, including v2's.
 */
const CACHE_NAME = 'samyak-v3-network-first';
const OFFLINE_FALLBACKS = ['/', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_FALLBACKS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache auth, APIs or anything personal.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Hashed build files never change, so they are safe to keep for offline use.
        if (res.ok && res.type === 'basic' && url.pathname.startsWith('/_next/static/')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') return (await caches.match('/')) || Response.error();
        return Response.error();
      })
  );
});

// ── Native OS Push Notification Handler ──────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'You have a new update.' };
  }

  const title = data.title || 'Samyak Guru';
  const options = {
    body: data.body || data.message || 'New update available.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.id || 'samyak-notification',
    data: {
      url: data.action_url || data.url || '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler: Focus / Open Window ──────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

