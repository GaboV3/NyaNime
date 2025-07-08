const CACHE_NAME = 'anime-catalogo-v1';
// Lista de ficheiros a serem guardados em cache.
const aGuardar = [
  './',
  './index.html',
  './detalhes.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap'
];

// Evento de instalação: guarda os ficheiros em cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(aGuardar);
      })
  );
});

// Evento de fetch: serve ficheiros a partir do cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o ficheiro estiver no cache, retorna-o. Senão, busca na rede.
        return response || fetch(event.request);
      })
  );
});
