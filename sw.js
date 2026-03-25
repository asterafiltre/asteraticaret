// ASTERA TİCARET – Service Worker
// Strateji: Network-First (önce ağdan çek, hata olursa cache kullan)
// Her deploy'da CACHE_VERSION'ı artır → eski cache otomatik silinir

const CACHE_VERSION = 'astera-v1';
const CACHE_NAME = CACHE_VERSION;

// Önbelleğe alınacak dosyalar (sadece font gibi 3rd party kaynaklar)
const STATIC_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap'
];

// Kurulum: static kaynakları önbelleğe al
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {
        // Font yüklenemezse hata verme, devam et
        return Promise.resolve();
      });
    }).then(function() {
      // Yeni SW hemen devreye girsin, beklemesin
      return self.skipWaiting();
    })
  );
});

// Aktivasyon: eski cache versiyonlarını temizle
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      // Tüm sekmeleri hemen kontrol et
      return self.clients.claim();
    })
  );
});

// Fetch: Network-First stratejisi
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Sadece GET isteklerini yönet
  if (event.request.method !== 'GET') return;

  // index.html için: her zaman ağdan çek, hata olursa cache'ten sun
  if (url.endsWith('/') || url.includes('index.html') || url.endsWith('/asteraticaret/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function(response) {
          // Başarılı yanıtı cache'e yaz (sonraki offline için)
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(function() {
          // Ağ yoksa cache'ten sun
          return caches.match(event.request);
        })
    );
    return;
  }

  // Fontlar için: Cache-First (değişmez kaynaklar)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Diğer tüm istekler: doğrudan ağa git
  // (cache müdahil etme)
});
