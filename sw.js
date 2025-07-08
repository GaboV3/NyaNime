const CACHE_NAME = 'anime-catalogo-v3'; // **ALTERAÇÃO: Versão do cache atualizada**
const NYAA_CACHE = 'nyaa-cache-v1';
const KITSU_API_CACHE = 'kitsu-api-cache-v1'; // **ALTERAÇÃO: Cache renomeado**
const IMAGE_CACHE = 'image-cache-v1';

const aGuardar = [
  '/NyaNime/',
  '/NyaNime/index.html',
  '/NyaNime/detalhes.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache principal aberto');
        return cache.addAll(aGuardar);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // **ALTERAÇÃO: Adicionado KITSU_API_CACHE à lista de caches a manter**
          if (cache !== CACHE_NAME && cache !== NYAA_CACHE && cache !== KITSU_API_CACHE && cache !== IMAGE_CACHE) {
            console.log('A limpar cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.href.includes('api.codetabs.com/v1/proxy?quest=https://nyaa.si')) {
    event.respondWith(
      caches.open(NYAA_CACHE).then((cache) => {
        return fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          return cache.match(event.request);
        });
      })
    );
    return;
  }
  
  // **ALTERAÇÃO: Estratégia agora aplicada à API da Kitsu**
  if (url.hostname === 'kitsu.io' && url.pathname.startsWith('/api/edge/anime')) {
    event.respondWith(
      caches.open(KITSU_API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
