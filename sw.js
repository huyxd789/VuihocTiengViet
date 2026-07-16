const CACHE_NAME = 'vui-hoc-tieng-viet-v9';
const STATIC_ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if(k !== CACHE_NAME) return caches.delete(k); // Xóa sạch rác cũ
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) return;

  // CHIẾN LƯỢC ĐẶC BIỆT CHO DATABASE: Ưu tiên tải từ mạng để luôn có câu hỏi mới
  if (event.request.url.includes('database.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request)) // Chỉ dùng đồ cũ nếu mất mạng
    );
    return;
  }

  // Các file tĩnh (HTML, CSS) thì lấy từ cache cho mượt
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