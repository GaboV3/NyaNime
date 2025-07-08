const CACHE_NAME = 'anime-catalogo-v2'; // **ALTERAÇÃO: Versão do cache atualizada**
const NYAA_CACHE = 'nyaa-cache-v1';
const JIKAN_API_CACHE = 'jikan-api-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Lista de ficheiros essenciais da aplicação para guardar em cache.
const aGuardar = [
  '/NyaNime/',
  '/NyaNime/index.html',
  '/NyaNime/detalhes.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
];

// Evento de instalação: guarda os ficheiros essenciais da aplicação.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache principal aberto');
        return cache.addAll(aGuardar);
      })
  );
});

// Evento de ativação: limpa caches antigos para manter a aplicação atualizada.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== NYAA_CACHE && cache !== JIKAN_API_CACHE && cache !== IMAGE_CACHE) {
            console.log('A limpar cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Evento de fetch: interceta todos os pedidos de rede.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Estratégia para a API do Nyaa (via proxy)
  if (url.href.includes('api.codetabs.com/v1/proxy?quest=https://nyaa.si')) {
    event.respondWith(
      caches.open(NYAA_CACHE).then((cache) => {
        // 1. Tenta obter da rede primeiro para ter os dados mais recentes.
        return fetch(event.request).then((networkResponse) => {
          // Se for bem-sucedido, guarda a nova resposta em cache e retorna-a.
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          // 2. Se a rede falhar, serve a partir do cache.
          return cache.match(event.request);
        });
      })
    );
    return;
  }
  
  // Estratégia para a API Jikan (Stale-While-Revalidate)
  if (url.hostname === 'api.jikan.moe') {
    event.respondWith(
      caches.open(JIKAN_API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // 1. Retorna imediatamente do cache se disponível.
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // 2. Em segundo plano, atualiza o cache com a nova resposta da rede.
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Estratégia para imagens (Stale-While-Revalidate)
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

  // Estratégia para os ficheiros principais da aplicação (Cache-First)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o ficheiro estiver no cache, retorna-o. Senão, busca na rede.
        return response || fetch(event.request);
      })
  );
});
