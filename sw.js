// ==========================================
// Service Worker (データの保存と更新管理)
// ==========================================

//⚠️ アプリを更新する時は、必ずここのバージョン番号を上げてください (v1 -> v2 -> v3...)
const CACHE_NAME = 'smart-coach-v19';

// キャッシュするファイル（オフラインで動くために必要なもの）
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon2.png',
  './custom_fonts.js'
];

// 1. インストール時（ファイルを保存する）
self.addEventListener('install', function(event) {
  // ⚠️ 修正点: ここでの self.skipWaiting() は削除しました。
  // 理由: ここで実行すると、ユーザーの確認を待たずに勝手に更新されてしまうためです。
  // 更新のタイミングは 'message' イベント（HTMLからの指示）に任せます。

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 有効化時（古いキャッシュを削除して、制御を開始する）
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
  // 新しいSWが有効になったら、ページをすぐに制御下に置く
  return self.clients.claim();
});

// 3. 通信時（ネットワーク優先 ＆ キャッシュ更新）
self.addEventListener('fetch', function(event) {
  // http/https 以外のリクエストは無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // ネットワークから成功したら、そのレスポンスを返す
        // CDNなどの外部リソース(cors)もキャッシュする場合は条件を調整してください
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // レスポンスのクローンを作成してキャッシュに保存
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

// 4. メッセージ受信時（HTML側からの「更新して！」という命令を受ける）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // ユーザーが「OK」を押したタイミングで初めて待機をスキップして更新する
    self.skipWaiting();
  }
});














