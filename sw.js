// ASTERA TİCARET – Service Worker
// Strateji: HTML için HİÇBİR ZAMAN cache kullanma
const CACHE_VERSION = 'astera-v3';
const CACHE_NAME = CACHE_VERSION;

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = req.url;
  if (req.method !== 'GET') return;

  var isHTML = url.includes('index.html') ||
               url.includes('astera-v4.html') ||
               url.endsWith('/asteraticaret/') ||
               url.endsWith('/asteraticaret');

  if (isHTML) {
    event.respondWith(
      fetch(new Request(req.url, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      })).catch(function() {
        return new Response('<h2 style="font-family:sans-serif;padding:20px">İnternet bağlantısı yok.</h2>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      })
    );
    return;
  }

  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
          return resp;
        });
      })
    );
    return;
  }
});
