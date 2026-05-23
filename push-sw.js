/* InkRush / Musai — Push Service Worker */

self.addEventListener('push', function (event) {
    if (!event.data) return;
    var data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'Musai', {
            body:    data.body  || '',
            icon:    data.icon  || '',
            badge:   data.badge || '',
            data:    { url: data.url || '/' },
            vibrate: [200, 100, 200],
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    var url = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].url === url && 'focus' in list[i]) return list[i].focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
