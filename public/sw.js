const CACHE_NAME = 'sugarapp-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Abaikan request pengiriman data ke Google Sheets agar antrean tetap jalan normal
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Ambil data terbaru dari internet di latar belakang (jika ada sinyal)
      const networked = fetch(event.request)
        .then((response) => {
          let cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          return response;
        })
        .catch(() => {
          // Jika offline total, gunakan memori yang ada
          if (event.request.mode === 'navigate') return caches.match('/index.html');
        });
      
      // Langsung tampilkan cache yang ada di HP, atau tunggu internet jika belum ada
      return cached || networked;
    })
  );
});
