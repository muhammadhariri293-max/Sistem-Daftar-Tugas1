const CACHE_NAME = 'todo-pwa-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './logo to do list.png',
    './icon-192.png',
    './icon-512.png'
];

// Install Service Worker & pre-cache assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activate Service Worker & clean up outdated caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(function() {
                return self.clients.claim();
            })
    );
});

// Fetch strategy
self.addEventListener('fetch', function(event) {
    const request = event.request;

    // Hanya tangani GET request dengan skema http/https
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }

    // Untuk navigasi dokumen (HTML): Network-First, fallback ke cache index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(function(networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(function() {
                    return caches.match('./index.html')
                        .then(function(cachedResponse) {
                            return cachedResponse || caches.match('./');
                        });
                })
        );
        return;
    }

    // Untuk asset statis: Cache-First, fallback ke network
    event.respondWith(
        caches.match(request)
            .then(function(cachedResponse) {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(function(networkResponse) {
                        // Simpan asset yang berhasil di-fetch ke dalam cache
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(request, responseToCache);
                            });
                        }
                        return networkResponse;
                    });
            })
    );
});
