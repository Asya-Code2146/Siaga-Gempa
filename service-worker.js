const CACHE_NAME = 'siagagempa-pwa-v3.0';

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


  if (url.pathname.includes('earthquake.php') || url.hostname.includes('bmkg.go.id')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
       
          return caches.match(event.request);
        })
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
    title: '⚠️ SiagaGempa - Peringatan Gempa!',
    body: 'Terdeteksi aktivitas seismik di Indonesia. Buka aplikasi untuk info detail.',
    url: 'index.html#dashboard'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: 'icons/logo.svg',
    badge: 'icons/logo.svg',
    vibrate: [400, 200, 400, 200, 800],
    data: { url: payload.url || 'index.html#dashboard' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || 'index.html#dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});