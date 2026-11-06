importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyArv4A5Lim9V8OeOCrRpu72ofAGCwRba-4',
  authDomain: 'pizzeria-baa36.firebaseapp.com',
  databaseURL: 'https://pizzeria-baa36-default-rtdb.firebaseio.com',
  projectId: 'pizzeria-baa36',
  storageBucket: 'pizzeria-baa36.firebasestorage.app',
  messagingSenderId: '139623834248',
  appId: '1:139623834248:web:be790941dcdab30db9353d',
});

const messaging = firebase.messaging();
const shownNotificationKeys = new Map();
const DEDUPE_TTL_MS = 60 * 1000;

function normalizePayloadType(data) {
  const rawType = String(data?.type || '').toLowerCase();
  const title = String(data?.title || '').toLowerCase();
  const message = String(data?.message || data?.body || '').toLowerCase();
  const combined = `${rawType} ${title} ${message}`;

  if (rawType === 'new_order' || title.includes('new order')) return 'new_order';
  if (
    rawType === 'order_received_confirmation' ||
    rawType.includes('received_confirmation') ||
    title.includes('delivery confirmed') ||
    message.includes('confirmed order delivery') ||
    message.includes('order reached successfully')
  ) {
    return 'order_received_confirmation';
  }
  if (rawType === 'order_cancelled' || combined.includes('cancel')) return 'order_cancelled';
  if (rawType === 'order_processing' || combined.includes('processing')) return 'order_processing';
  if (rawType === 'order_on_way' || combined.includes('on delivery') || combined.includes('on the way')) return 'order_on_way';
  if (rawType === 'order_delivered' || combined.includes('delivered')) return 'order_delivered';
  if (rawType === 'new_review' || title.includes('new review')) return 'new_review';
  return rawType;
}

function notificationKey(payload) {
  const data = payload?.data || {};
  const normalizedType = normalizePayloadType(data);
  if (data.reviewId && normalizedType) return `review:${data.reviewId}:${normalizedType}:${data.userId || ''}`;
  if (data.orderId && normalizedType) return `order:${data.orderId}:${normalizedType}:${data.userId || ''}`;
  if (data.notificationId) return data.notificationId;
  return payload?.messageId || `${data.title || ''}:${data.message || data.body || ''}`;
}

async function claimNotification(key) {
  if (!key) return true;

  const now = Date.now();
  [...shownNotificationKeys.entries()].forEach(([storedKey, shownAt]) => {
    if (now - shownAt > DEDUPE_TTL_MS) shownNotificationKeys.delete(storedKey);
  });

  if (shownNotificationKeys.has(key)) return false;

  const notifications = await self.registration.getNotifications({ tag: key });
  if (notifications.length > 0) return false;

  shownNotificationKeys.set(key, now);
  return true;
}

messaging.onBackgroundMessage(async payload => {
  if (payload.notification) return;

  const key = notificationKey(payload);
  const claimed = await claimNotification(key);
  if (!claimed) return;

  const title = payload.notification?.title || payload.data?.title || 'Pizzeria update';
  const options = {
    body: payload.notification?.body || payload.data?.body || payload.data?.message || '',
    data: payload.data || {},
    tag: key || payload.data?.orderId || payload.messageId,
    renotify: false,
  };

  self.registration.showNotification(title, options);
});
