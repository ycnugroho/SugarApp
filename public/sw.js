const CACHE_NAME = 'sugarapp-offline-final';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Hanya paksa simpan halaman akar ('/') untuk menghindari gagal install karena gambar hilang
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  // JANGAN cache URL Google Sheets agar Sinkronisasi Offline tetap berjalan
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    // ignoreSearch: true memastikan URL seperti /?source=pwa tetap dianggap sebagai /
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      
      // Ambil pembaruan dari internet secara diam-diam
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });

      // JIKA OFFLINE & user membuka halaman web, SELALU arahkan ke '/' (Halaman Utama)
      if (event.request.mode === 'navigate') {
        return fetchPromise.catch(() => caches.match('/', { ignoreSearch: true }));
      }

      // Untuk file CSS, JS, dan Gambar: pakai cache yang ada, kalau kosong tunggu internet
      return cachedResponse || fetchPromise;
    })
  );
});
