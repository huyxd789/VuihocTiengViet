const CACHE_NAME = 'vui-hoc-tieng-viet-v7';

// Danh sách file tĩnh cần cache ngay khi mở web lần đầu tiên
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './database.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Ưu tiên tải bản mới từ mạng
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Nếu không có mạng thì bỏ qua
      });

      // Trả ngay bản cache nếu có, nếu không thì đợi tải xong từ mạng
      return cachedResponse || fetchPromise;
    })
  );
});