const CACHE_NAME = 'smart-coach-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon2.png'
  // 必要であればここに custom_fonts.js などローカルファイルを追加
];

// インストール処理
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエスト処理（ネットワーク優先、オフライン時はキャッシュ）
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});