// Định nghĩa phiên bản bộ nhớ đệm (Tăng số này lên v4, v5... mỗi khi bạn sửa code hoặc cập nhật database)
const CACHE_NAME = 'vui-hoc-tieng-viet-v3';

// Danh sách các file tĩnh nội bộ bắt buộc phải lưu để chạy được Offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './database.json'
];

// 1. SỰ KIỆN INSTALL: Tải trước toàn bộ file tĩnh cốt lõi vào máy
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Đang tải trước tài nguyên hệ thống...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Ép Service Worker mới hoạt động ngay lập tức
  );
});

// 2. SỰ KIỆN ACTIVATE: Dọn dẹp sạch sẽ bộ nhớ đệm cũ để nạp tính năng mới
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Đang xóa bộ nhớ đệm cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Giành quyền kiểm soát trang ngay lập tức
  );
});

// 3. SỰ KIỆN FETCH: Chiến lược tối ưu hóa mạng cho iOS Safari (Stale-While-Revalidate)
self.addEventListener('fetch', event => {
  // Chỉ xử lý các yêu cầu HTTP/HTTPS thông thường (Bỏ qua chrome-extension, v.v.)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Nếu file đã có trong bộ nhớ máy -> Trả về ngay lập tức để app chạy nhanh mượt (Offline)
      if (cachedResponse) {
        // Đồng thời vẫn âm thầm tải bản mới từ Internet (nếu có mạng) để cập nhật cho lần mở app sau
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Bỏ qua lỗi nếu mất mạng */});

        return cachedResponse;
      }

      // Nếu file chưa được cache (ví dụ các thư viện CDN như Tailwind, Google Fonts tải lần đầu)
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Tự động lưu file mới này vào cache để lần sau không cần tải lại
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Trả về trang lỗi mặc định nếu mất mạng hoàn toàn và file chưa được lưu
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});