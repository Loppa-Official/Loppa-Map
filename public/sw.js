// Service Worker для офлайн карт
const CACHE_NAME = 'loppo-map-v1';
const TILE_CACHE = 'loppo-tiles-v1';

// Кэшируем при установке
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/src/main.jsx',
                '/src/App.jsx',
                '/src/index.css',
            ]);
        })
    );
    self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== TILE_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Перехватываем запросы
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Кэшируем тайлы карты
    if (url.hostname.includes('basemaps.cartocdn.com') ||
        url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(TILE_CACHE).then((cache) => {
                return cache.match(event.request).then((cached) => {
                    if (cached) return cached;

                    return fetch(event.request).then((response) => {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(() => {
                        // Офлайн — возвращаем заглушку или ничего
                        return new Response('', { status: 404 });
                    });
                });
            })
        );
        return;
    }

    // Остальные запросы
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).catch(() => {
                return caches.match('/');
            });
        })
    );
});
