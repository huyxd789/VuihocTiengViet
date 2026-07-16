const CACHE_NAME = 'tiengviet-pwa-v1';
// Khai báo các file cần tải về máy để chạy Offline
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Sự kiện Cài đặt (Install): Lưu file vào bộ nhớ đệm
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Đã cache thành công các file');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Ép kích hoạt Service Worker ngay lập tức
});

// Sự kiện Kích hoạt (Activate): Dọn dẹp cache cũ nếu bạn cập nhật phiên bản mới
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Đã xóa cache cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Sự kiện Lấy dữ liệu (Fetch): Ưu tiên lấy từ máy (Offline), nếu không có mới lên mạng tải
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Trả về file trong máy nếu có
        if (response) {
          return response;
        }
        // Nếu không có thì tải từ Internet
        return fetch(event.request);
      })
  );
});