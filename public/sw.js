const CACHE_NAME = 'sugarapp-offline-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Wajibkan kerangka utama dan ikon untuk langsung disedot
      return cache.addAll(['/', '/index.html', '/icon-192.png', '/icon-512.png', '/icon1.png', '/manifest.json']);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Abaikan request pengiriman data ke Google Sheets atau non-HTTP
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // STRATEGI TANGGUH: Jika ada di memori HP, langsung tampilkan (offline lancar).
      if (cached) {
        // Secara diam-diam di latar belakang, tetap cari versi terbaru jika ada internet
        fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
        }).catch(() => {});
        return cached;
      }
      
      // Jika belum ada di memori, ambil dari internet lalu simpan ke memori untuk nanti
      return fetch(event.request).then((response) => {
        let cacheCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        return response;
      }).catch(() => {
        // Jika internet mati total dan file tidak ditemukan, arahkan kembali ke halaman utama
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
