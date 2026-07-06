/* ============================================================
   JerseyVault — Service Worker (sw.js)
   Handles background push-like messages and shows
   OS-level browser notifications for new orders.
   ============================================================ */

const CACHE_NAME = 'jersey-vault-sw-v1';

// ── Install / Activate ────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Message from main thread → show notification ──────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NEW_ORDER') {
    const { orderId, customerName, total, payMethod } = event.data;

    const payLabel = payMethod === 'COD' ? 'COD' : 'Paid Online';

    event.waitUntil(
      self.registration.showNotification('🛍️ New Order Received!', {
        body: `Order #${String(orderId).slice(-8).toUpperCase()}\n₹${total} · ${customerName || 'Customer'} · ${payLabel}`,
        icon: '/logo192.png',
        badge: '/favicon.ico',
        tag: `order-${orderId}`,          // deduplicates if fired multiple times
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { url: '/admin' },
      })
    );
  }
});

// ── Notification click → open /admin ─────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing /admin tab
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
