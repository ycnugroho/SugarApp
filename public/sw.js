const CACHE_NAME = 'sugarapp-offline-sempurna';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Kunci halaman utama DAN logo aplikasi secara paksa
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/icon1.png']))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });

      if (event.request.mode === 'navigate') {
        return fetchPromise.catch(() => caches.match('/', { ignoreSearch: true }));
      }

      return cachedResponse || fetchPromise;
    })
  );
});
