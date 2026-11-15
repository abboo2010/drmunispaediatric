/* Service worker — makes the site installable and gives a basic offline fallback.
   Pages: network-first (so CMS edits show immediately), falling back to cache offline.
   Static assets: stale-while-revalidate. Admin/CMS, Supabase and other origins are never touched. */
const VERSION = 'v1';
const CACHE = 'drmunis-' + VERSION;
const PRECACHE = ['/', '/index.html', '/about.html', '/services.html', '/contact.html',
  '/css/style.css', '/js/main.js', '/img/logo-mark.png', '/img/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('drmunis-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // fonts, Supabase, Web3Forms etc. go straight to network
  if (url.pathname.startsWith('/admin')) return;          // CMS is never cached

  if (req.mode === 'navigate') {                          // pages: network first
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  e.respondWith(                                          // assets: stale-while-revalidate
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
