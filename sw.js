const CACHE_NAME = 'vui-hoc-tieng-viet-v8';
const STATIC_ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  self.skipWaiting(); // Ép cài đặt bản mới ngay lập tức
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if(k !== CACHE_NAME) return caches.delete(k); // Xóa sạch bộ nhớ đệm của các bản trước
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) return;

  // CHIẾN LƯỢC NETWORK-FIRST CHO DATABASE.JSON
  // Đảm bảo iPhone luôn tải file JSON mới nhất từ Github nếu có mạng
  if (event.request.url.includes('database.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request)) // Chỉ dùng đồ cũ nếu mất mạng (Offline)
    );
    return;
  }

  // Đối với các file khác (HTML, hình ảnh), ưu tiên lấy từ máy cho nhanh
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      });
    })
  );
});