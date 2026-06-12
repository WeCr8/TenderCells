// service-worker.ts
self.addEventListener('install', (event) => {
  const installEvent = event as Event & { waitUntil: (promise: Promise<unknown>) => void };
  installEvent.waitUntil(
    caches.open('tendercells-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/images/tender_cells_logo.png',
        '/assets/main.css',
        '/assets/main.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as Event & {
    request: Request;
    respondWith: (response: Promise<Response>) => void;
  };
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((response) => {
      return response || fetch(fetchEvent.request);
    })
  );
});
