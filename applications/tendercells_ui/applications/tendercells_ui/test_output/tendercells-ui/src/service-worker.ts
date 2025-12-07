// service-worker.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('tendercells-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/logo.png',
        '/assets/main.css',
        '/assets/main.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
