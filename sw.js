// ==========================================
// Service Worker (データの保存と更新管理)
// ==========================================

// ⚠️ アプリを更新する時は、必ずここのバージョン番号を上げてください (v1 -> v2 -> v3...)
const CACHE_NAME = 'smart-coach-v4';

// キャッシュするファイル（オフラインで動くために必要なもの）
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon2.png',
  './custom_fonts.js' // 必要な外部ファイルがあれば追加
];

// 1. インストール時（ファイルを保存する）
self.addEventListener('install', function(event) {
  // 新しいSWをすぐに有効化させる
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 有効化時（古いキャッシュを削除して更新する）★重要
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 現在のCACHE_NAMEと違うものは全て削除
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 全ページを新しいSWの制御下に置く
  return self.clients.claim();
});

// 3. 通信時（ネットワーク優先 ＆ キャッシュ更新）
self.addEventListener('fetch', function(event) {
  // http/https 以外のリクエスト（chrome-extension等）は無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // ネットワークから成功したら、そのレスポンスを返す
        // 同時に、次回オフライン用にキャッシュを「最新版」に上書きする
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        var responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(function() {
        // オフラインならキャッシュを返す
        return caches.match(event.request);
      })
  );
});


