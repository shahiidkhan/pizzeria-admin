import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  PROCESSING: 'order_processing',
  ON_WAY: 'order_on_way',
  DELIVERED: 'order_delivered',
  CANCELLED: 'order_cancelled',
  RECEIVED_CONFIRMATION: 'order_received_confirmation',
  NEW_REVIEW: 'new_review',
};

const STATUS_MESSAGES = {
  processing: {
    type: NOTIFICATION_TYPES.PROCESSING,
    title: 'Order update',
    message: 'Your order is processing',
  },
  onTheWay: {
    type: NOTIFICATION_TYPES.ON_WAY,
    title: 'Order update',
    message: 'Your order is on delivery',
  },
  delivered: {
    type: NOTIFICATION_TYPES.DELIVERED,
    title: 'Order delivered',
    message: 'Your order is delivered',
  },
  cancelled: {
    type: NOTIFICATION_TYPES.CANCELLED,
    title: 'Order cancelled',
    message: 'Your order is cancelled',
  },
};

function getCustomerId(order = {}) {
  return order.userId || order.customerId || order.customer?.uid || order.customer?.id || null;
}

function getCustomerName(order = {}) {
  return order.customer?.name || order.customerName || order.name || 'Customer';
}

function getOrderTotal(order = {}) {
  const total = order.total ?? order.grandTotal ?? order.amount;
  return total === undefined || total === null ? '' : String(total);
}

function getReviewUserId(review = {}) {
  return review.userId || review.customerId || review.customer?.uid || review.customer?.id || null;
}

async function getUserName(userId) {
  if (!userId) return 'Customer';
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return 'Customer';
  const user = snap.data() || {};
  return user.name || user.displayName || user.fullName || user.email || user.phone || 'Customer';
}

async function getProductName(productId) {
  if (!productId) return 'a product';
  const snap = await db.collection('products').doc(productId).get();
  if (!snap.exists) return 'a product';
  const product = snap.data() || {};
  return product.name || product.title || product.productName || 'a product';
}

function notificationDocId(data) {
  const entityId = data.orderId || data.reviewId;
  if (!entityId || !data.type || !data.userId) return null;
  return `${data.userId}_${entityId}_${data.type}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function notificationDeliveryKey(notification, fallbackId) {
  if (notification.reviewId && notification.type) {
    return `review:${notification.reviewId}:${notification.type}:${notification.userId || ''}`;
  }
  if (notification.orderId && notification.type) {
    return `order:${notification.orderId}:${notification.type}:${notification.userId || ''}`;
  }
  return fallbackId;
}

async function createNotification(data) {
  if (!data.userId || !data.type) return null;

  const payload = {
    userId: data.userId,
    targetRole: data.targetRole || (data.userId === 'admin' ? 'admin' : 'customer'),
    orderId: data.orderId || null,
    reviewId: data.reviewId || null,
    productId: data.productId || null,
    route: data.route || null,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docId = notificationDocId(data);
  if (!docId) return db.collection('notifications').add(payload);

  const notificationRef = db.collection('notifications').doc(docId);
  return db.runTransaction(async transaction => {
    const existing = await transaction.get(notificationRef);
    if (existing.exists) return null;
    transaction.set(notificationRef, payload);
    return notificationRef;
  });
}

async function getRecipientTokens(notification) {
  const tokenRef = db.collection('fcmTokens');
  const snapshot = notification.userId === 'admin'
    ? await tokenRef.where('role', '==', 'admin').get()
    : await tokenRef.where('userId', '==', notification.userId).get();

  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(token => token.token)
    .filter((token, index, tokens) => tokens.findIndex(item => item.token === token.token) === index);
}

async function removeInvalidTokens(tokens, responses) {
  const batch = db.batch();
  let count = 0;

  responses.forEach((response, index) => {
    if (response.success) return;
    const code = response.error?.code || '';
    if (!code.includes('registration-token-not-registered') && !code.includes('invalid-argument')) return;
    batch.delete(db.collection('fcmTokens').doc(tokens[index].id));
    count += 1;
  });

  if (count > 0) await batch.commit();
}

function chunkTokens(tokens, size = 500) {
  const chunks = [];
  for (let index = 0; index < tokens.length; index += size) {
    chunks.push(tokens.slice(index, index + size));
  }
  return chunks;
}

export const notifyAdminsOnOrderCreated = onDocumentCreated('orders/{orderId}', async event => {
  const order = event.data?.data();
  if (!order) return;

  await createNotification({
    userId: 'admin',
    targetRole: 'admin',
    orderId: event.params.orderId,
    type: NOTIFICATION_TYPES.NEW_ORDER,
    title: 'New order received',
    message: `${getCustomerName(order)} placed a new order${getOrderTotal(order) ? ` (${getOrderTotal(order)})` : ''}.`,
  });
});

export const notifyAdminsOnReviewCreated = onDocumentCreated('reviews/{reviewId}', async event => {
  const review = event.data?.data();
  if (!review) return;

  const [customerName, productName] = await Promise.all([
    getUserName(getReviewUserId(review)),
    getProductName(review.productId),
  ]);
  const rating = Number(review.rating || 0);
  const ratingText = rating ? `${rating} star${rating === 1 ? '' : 's'}` : 'a rating';

  await createNotification({
    userId: 'admin',
    targetRole: 'admin',
    reviewId: event.params.reviewId,
    productId: review.productId || null,
    type: NOTIFICATION_TYPES.NEW_REVIEW,
    title: 'New review received',
    message: `${customerName} reviewed ${productName} with ${ratingText}.`,
    route: '/reviews',
  });
});

export const createNotificationsOnOrderUpdate = onDocumentUpdated('orders/{orderId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const orderId = event.params.orderId;
  const customerId = getCustomerId(after);

  if (before.status !== after.status && STATUS_MESSAGES[after.status]) {
    await createNotification({
      userId: customerId,
      orderId,
      ...STATUS_MESSAGES[after.status],
    });
  }

  const wasConfirmed = Boolean(
    before.customerConfirmed ||
    before.confirmedDelivered ||
    before.userConfirmed ||
    before.userReceived
  );
  const isConfirmed = Boolean(
    after.customerConfirmed ||
    after.confirmedDelivered ||
    after.userConfirmed ||
    after.userReceived
  );
  if (!wasConfirmed && isConfirmed) {
    await createNotification({
      userId: 'admin',
      targetRole: 'admin',
      orderId,
      type: NOTIFICATION_TYPES.RECEIVED_CONFIRMATION,
      title: 'Delivery confirmed',
      message: `${getCustomerName(after)} confirmed order delivery.`,
    });
  }
});

export const sendPushOnNotificationCreated = onDocumentCreated('notifications/{notificationId}', async event => {
  const notification = event.data?.data();
  if (!notification) return;

  const tokens = await getRecipientTokens(notification);
  if (tokens.length === 0) return;

  try {
    for (const tokenChunk of chunkTokens(tokens)) {
      const notificationKey = notificationDeliveryKey(notification, event.params.notificationId);
      const response = await messaging.sendEachForMulticast({
        notification: {
          title: notification.title || 'Pizzeria update',
          body: notification.message || '',
        },
        webpush: {
          notification: {
            title: notification.title || 'Pizzeria update',
            body: notification.message || '',
            tag: notificationKey,
            renotify: false,
          },
        },
        data: {
          notificationId: event.params.notificationId,
          orderId: notification.orderId || '',
          reviewId: notification.reviewId || '',
          productId: notification.productId || '',
          route: notification.route || '',
          type: notification.type || '',
          userId: notification.userId || '',
          title: notification.title || '',
          message: notification.message || '',
        },
        tokens: tokenChunk.map(token => token.token),
      });
      await removeInvalidTokens(tokenChunk, response.responses);
    }
  } catch (error) {
    logger.error('Failed to send push notification', error);
  }
});
