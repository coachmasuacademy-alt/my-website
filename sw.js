// ==========================================
// Service Worker (Smart Coach Badminton v33)
// ==========================================

const CACHE_NAME = 'smart-coach-v36';

// キャッシュする最小限の静的アセット
const urlsToCache = [
  './',
  './training_program.html',
  './manifest.json',
  './icon2.png',
  './custom_fonts.js'
];

// 1. インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing new worker and caching core assets');
      // 一部のファイルが無くてもインストール自体は進めるように個別に追加
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
});

// 2. 有効化時（古いキャッシュの自動削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Cleanup old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 新しいSWをすぐに適用
  return self.clients.claim();
});

// 3. 通信時（フェッチイベント）
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外、または外部ドメイン（Firebase等）の一部を除外
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  // 拡張子チェック（動画ファイルなどはキャッシュを避ける設定も可能）
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したレスポンスのみキャッシュに保存
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // ネットワークエラー（オフライン）時にキャッシュを返す
        return caches.match(event.request);
      })
  );
});

// 4. 更新指示の待機
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});





























