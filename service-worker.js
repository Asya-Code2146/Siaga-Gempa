const CACHE_NAME = 'siagagempa-pwa-v3.2';

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/notifications.js',
  'js/earthquake.js',
  'js/emergency.js',
  'js/system.js',
  'js/app.js',
  'icons/logo.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets for offline use...');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Beberapa asset gagal dicache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('bmkg.go.id')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return caches.match('index.html');
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '⚠️ Siaga Gempa - Peringatan Gempa!',
    body: 'Terdeteksi aktivitas seismik di Indonesia. Buka aplikasi untuk info detail.'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: 'icons/logo.svg',
    badge: 'icons/logo.svg',
    vibrate: [500, 200, 500, 200, 1000],
    data: { url: 'index.html' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      return clients.openWindow('index.html');
    })
  );
});