var CACHE_NAME = 'weekly-planner-v22';
var ASSETS = [
  '/my-weekly-plan/',
  '/my-weekly-plan/index.html',
  '/my-weekly-plan/周计划模板.html',
  '/my-weekly-plan/manifest.json',
  '/my-weekly-plan/icon-192.png',
  '/my-weekly-plan/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  if (url.hostname === 'api.github.com') {
    return;
  }

  event.respondWith(
    new Promise(function(resolve) {
      var timeoutId = setTimeout(function() {
        // 15s 超时，降级到缓存
        caches.match(event.request).then(function(cached) {
          resolve(cached || new Response('Offline', { status: 503 }));
        }).catch(function() {
          resolve(new Response('Offline', { status: 503 }));
        });
      }, 15000);

      fetch(event.request, { cache: 'no-cache' }).then(function(response) {
        clearTimeout(timeoutId);
        if (event.request.method === 'GET' && response.status === 200) {
          var cloned = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, cloned);
          });
        }
        resolve(response);
      }).catch(function() {
        clearTimeout(timeoutId);
        caches.match(event.request).then(function(cached) {
          resolve(cached || caches.match('/my-weekly-plan/index.html'));
        }).catch(function() {
          resolve(new Response('Offline', { status: 503 }));
        });
      });
    })
  );
});
