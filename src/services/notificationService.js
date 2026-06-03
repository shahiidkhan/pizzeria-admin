import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COL = 'notifications';
const ref = () => collection(db, COL);

export const NOTIFICATION_TYPES = {
  PROCESSING: 'order_processing',
  ON_WAY: 'order_on_way',
  DELIVERED: 'order_delivered',
  CANCELLED: 'order_cancelled',
  RECEIVED_CONFIRMATION: 'order_received_confirmation',
  REVIEW_REQUEST: 'review_request',
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

  async create(data) {
    const docRef = await addDoc(ref(), {
      userId: data.userId ?? null,
      orderId: data.orderId ?? null,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
    });
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
