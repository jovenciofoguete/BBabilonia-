/* sw.js — B-Babilônia: recebe as notificações e abre a página certa ao tocar */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { texto: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'B-Babilônia', {
    body: d.texto || '', tag: d.id || undefined, renotify: true,
    data: { link: d.link || 'avisos.html' }, vibrate: [120, 60, 120]
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.link) || 'avisos.html', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) { if (l[i].url === url && 'focus' in l[i]) return l[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
