var CACHE_NAME = 'weekly-planner-v8';
var ASSETS = [
  '/my-weekly-plan/',
  '/my-weekly-plan/index.html',
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
    fetch(event.request, { cache: 'no-cache' }).then(function(response) {
      if (event.request.method === 'GET' && response.status === 200) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, cloned);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('/my-weekly-plan/index.html');
      });
    })
  );
});
