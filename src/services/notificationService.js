import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'notifications';
const ref = () => collection(db, COL);

function notificationDocId(data) {
  const entityId = data?.orderId || data?.reviewId;
  if (!data?.userId || !entityId || !data?.type) return null;
  return `${data.userId}_${entityId}_${data.type}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function normalizeNotificationPayload(data) {
  const targetRole = data.targetRole ?? (data.userId === 'admin' ? 'admin' : 'customer');

  return {
    userId: data.userId ?? null,
    targetRole,
    orderId: data.orderId ?? null,
    reviewId: data.reviewId ?? null,
    productId: data.productId ?? null,
    route: data.route ?? null,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    createdAt: serverTimestamp(),
  };
}

export const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  PROCESSING: 'order_processing',
  ON_WAY: 'order_on_way',
  DELIVERED: 'order_delivered',
  CANCELLED: 'order_cancelled',
  RECEIVED_CONFIRMATION: 'order_received_confirmation',
  REVIEW_REQUEST: 'review_request',
  NEW_REVIEW: 'new_review',
};

const STATUS_MESSAGES = {
  processing: { type: NOTIFICATION_TYPES.PROCESSING, title: 'Order update', message: 'Your order is processing' },
  onTheWay: { type: NOTIFICATION_TYPES.ON_WAY, title: 'Order update', message: 'Your order is on the way' },
  delivered: { type: NOTIFICATION_TYPES.DELIVERED, title: 'Order delivered', message: 'Your order is delivered' },
  cancelled: { type: NOTIFICATION_TYPES.CANCELLED, title: 'Order cancelled', message: 'Your order is cancelled' },
};

export const notificationService = {
  subscribe(callback, onError, options = {}) {
    const clauses = [];
    if (options.userId !== undefined) clauses.push(where('userId', '==', options.userId));
    if (options.limitToUnread) clauses.push(where('read', '==', false));
    clauses.push(orderBy('createdAt', 'desc'));
    const q = query(ref(), ...clauses);

    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError
    );
  },

  subscribeAdmin(callback, onError) {
    const q = query(ref(), orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onError
    );
  },

  async create(data) {
    const payload = normalizeNotificationPayload(data);
    const deterministicId = notificationDocId(payload);

    if (deterministicId) {
      const notificationRef = doc(db, COL, deterministicId);
      const created = await runTransaction(db, async transaction => {
        const existing = await transaction.get(notificationRef);
        if (existing.exists()) return false;
        transaction.set(notificationRef, payload);
        return true;
      });
      return created ? notificationRef.id : null;
    }

    const docRef = await addDoc(ref(), payload);
    return docRef.id;
  },

  async createOrderStatusNotification(order, status) {
    const config = STATUS_MESSAGES[status];
    if (!config) return null;
    return this.create({
      userId: order.userId || order.customerId || order.customer?.uid || null,
      orderId: order.id,
      ...config,
    });
  },

  async createDeliveryConfirmationNotification(order) {
    return this.create({
      userId: 'admin',
      targetRole: 'admin',
      orderId: order.id,
      type: NOTIFICATION_TYPES.RECEIVED_CONFIRMATION,
      title: 'Delivery confirmed',
      message: 'The order reached successfully',
    });
  },

  async createReviewRequestNotification(order) {
    const existing = await getDocs(
      query(
        ref(),
        where('orderId', '==', order.id),
        where('type', '==', NOTIFICATION_TYPES.REVIEW_REQUEST),
        limit(1),
      ),
    );
    if (!existing.empty) return null;
    return this.create({
      userId: order.userId || order.customerId || order.customer?.uid || null,
      orderId: order.id,
      type: NOTIFICATION_TYPES.REVIEW_REQUEST,
      title: 'Review your order',
      message: 'Please rate and review your delivered order',
    });
  },

  async markAsRead(id) {
    await updateDoc(doc(db, COL, id), {
      read: true,
      readAt: serverTimestamp(),
    });
  },

  async markAllAsRead(ids) {
    if (!ids.length) return;
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.update(doc(db, COL, id), {
        read: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  },
};
