const CACHE_NAME = 'flashcard-v1';
const BASE_PATH = self.location.pathname.replace('/sw.js', '');

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/style.css`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/vocab.csv`,
  `${BASE_PATH}/images/icon-192.png`,
  `${BASE_PATH}/images/icon-512.png`,
  `${BASE_PATH}/manifest.json`
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercept requests and use cache
self.addEventListener('fetch', event => {
  // For vocab.csv, try network first then fallback to cache
  if (event.request.url.includes('vocab.csv')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Clone response for caching
          const clonedResponse = networkResponse.clone();
          // Update cache
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Other resources use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Add message listener for manual updates
self.addEventListener('message', event => {
  if (event.data === 'update') {
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => console.log('Cache manually updated'));
  }
});
