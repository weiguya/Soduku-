/* Muifei service worker — network-first สำหรับ index.html, cache-first สำหรับไอคอน
   ตั้งใจใช้ network-first กับตัวแอป เพราะปัญหาคลาสสิกของ PWA คือ
   อัปไฟล์ใหม่ขึ้น GitHub แล้วเครื่องยังเห็นของเก่าค้างอยู่ */
/* Ver.65: ขึ้นเลขทุกครั้งที่เปลี่ยนไอคอน/มาสคอต — ไม่งั้นของเก่าค้างในแคชตลอดไป */
var CACHE = 'muifei-v3';
var SHELL = ['./index.html', './manifest.webmanifest', './mascot.png',
             './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  /* ข้อมูลจาก Supabase และไลบรารีจาก CDN — ห้ามแคช ต้องสดเสมอ */
  if (url.origin !== self.location.origin) return;

  var isDoc = req.mode === 'navigate' || url.pathname.indexOf('index.html') >= 0;

  if (isDoc) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
