// src/services/orderService.js
import {
  collection, doc, getDocs, getDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { notificationService } from './notificationService';
import { enrichOrder } from '../utils/orderHelpers';

const COL = 'orders';
const ref = () => collection(db, COL);
const usersRef = () => collection(db, 'users');
const branchesRef = () => collection(db, 'branches');
const productsRef = () => collection(db, 'products');

export const ORDER_STATUS_CONFIG = {
  processing: { label: 'Order Processing', color: 'blue' },
  onTheWay:   { label: 'Order On Delivery', color: 'amber' },
  delivered:  { label: 'Order Delivered',  color: 'green' },
  cancelled:  { label: 'Order Cancelled',  color: 'red'  },
};

function toMap(snapshot) {
  return Object.fromEntries(snapshot.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
}

function isConfirmed(order) {
  return !!(order?.customerConfirmed || order?.confirmedDelivered);
}

export const orderService = {
  async getAll() {
    const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateStatus(id, status) {
    const current = await this.getById(id);
    if (!current) throw new Error('Order not found.');
    if (isConfirmed(current)) {
      throw new Error('This order has been confirmed by the customer and can no longer be changed.');
    }
    if (current.status === 'cancelled') {
      throw new Error('Cancelled orders cannot be updated.');
    }
    if (current.status === 'delivered' && status === 'cancelled') {
      throw new Error('Delivered orders cannot be cancelled.');
    }

    const payload = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'delivered') {
      payload.deliveredAt = serverTimestamp();
      payload.reviewRequested = false;
      payload.reviewRequestedAt = null;
      payload.reviewRequestDueAt = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
    }

    if (status === 'cancelled') {
      payload.cancellationAllowed = false;
      payload.cancellationDeadline = null;
      payload.cancelledBy = 'admin';
      payload.cancelledAt = serverTimestamp();
    }

    await updateDoc(doc(db, COL, id), {
      ...payload,
    });
    await notificationService.createOrderStatusNotification({ ...current, id }, status);
  },

  async allowCancellation(id) {
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found.');
    if (isConfirmed(order) || order.status === 'delivered' || order.status === 'cancelled') {
      throw new Error('Cancellation cannot be enabled for this order.');
    }
    const deadline = Timestamp.fromMillis(Date.now() + 5 * 60 * 1000);
    await updateDoc(doc(db, COL, id), {
      cancellationAllowed: true,
      cancellationDeadline: deadline,
      updatedAt: serverTimestamp(),
    });
    return deadline;
  },

  async requestCancellation(id) {
    const order = await this.getById(id);
    if (isConfirmed(order)) {
      throw new Error('This order has already been confirmed.');
    }
    if (!order?.cancellationAllowed || !order.cancellationDeadline) {
      throw new Error('Cancellation is not available for this order.');
    }
    const deadline = order.cancellationDeadline?.toDate ? order.cancellationDeadline.toDate() : new Date(order.cancellationDeadline);
    if (Date.now() > deadline.getTime()) {
      await updateDoc(doc(db, COL, id), {
        cancellationAllowed: false,
        updatedAt: serverTimestamp(),
      });
      throw new Error('Cancellation window has expired.');
    }
    await updateDoc(doc(db, COL, id), {
      status: 'cancelled',
      cancellationAllowed: false,
      cancellationDeadline: null,
      cancelledBy: 'customer',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await notificationService.createOrderStatusNotification({ ...order, id }, 'cancelled');
  },

  async confirmDelivery(id) {
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found.');
    await updateDoc(doc(db, COL, id), {
      customerConfirmed: true,
      confirmedAt: serverTimestamp(),
      confirmedDelivered: true,
      confirmedDeliveredAt: serverTimestamp(),
      cancellationAllowed: false,
      cancellationDeadline: null,
      updatedAt: serverTimestamp(),
    });
    await notificationService.createDeliveryConfirmationNotification({ ...order, id });
  },

  async sendDueReviewRequest(id) {
    const order = await this.getById(id);
    if (!order || order.status !== 'delivered' || order.reviewRequested) return;
    const due = order.reviewRequestDueAt?.toDate ? order.reviewRequestDueAt.toDate() : null;
    if (due && Date.now() < due.getTime()) return;
    await notificationService.createReviewRequestNotification({ ...order, id });
    await updateDoc(doc(db, COL, id), {
      reviewRequested: true,
      reviewRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async remove(id) {
    await deleteDoc(doc(db, COL, id));
  },

  /** Realtime orders listener – primary use for orders page & dashboard */
  subscribe(callback) {
    const q = query(ref(), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  subscribeDetailed(callback, onError) {
    const state = {
      orders: [],
      usersById: {},
      branchesById: {},
      productsById: {},
      ready: { orders: false, users: false, branches: false, products: false },
    };

    const emit = () => {
      if (!Object.values(state.ready).every(Boolean)) return;
      callback(state.orders.map(order => enrichOrder(order, state)));
    };

    const unsubscribers = [
      onSnapshot(
        query(ref(), orderBy('createdAt', 'desc')),
        snap => {
          state.orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          state.ready.orders = true;
          emit();
        },
        onError,
      ),
      onSnapshot(usersRef(), snap => {
        state.usersById = toMap(snap);
        state.ready.users = true;
        emit();
      }, onError),
      onSnapshot(branchesRef(), snap => {
        state.branchesById = toMap(snap);
        state.ready.branches = true;
        emit();
      }, onError),
      onSnapshot(productsRef(), snap => {
        state.productsById = toMap(snap);
        state.ready.products = true;
        emit();
      }, onError),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  },

  /** Listen to a single order document */
  subscribeOne(id, callback) {
    return onSnapshot(doc(db, COL, id), snap => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  },

  subscribeOneDetailed(id, callback, onError) {
    let selectedOrder = null;
    let orderReady = false;
    let detailedOrders = [];
    let detailsReady = false;

    const emit = () => {
      if (!orderReady || !detailsReady) return;
      if (!selectedOrder) {
        callback(null);
        return;
      }
      callback(detailedOrders.find(order => order.id === selectedOrder.id) || selectedOrder);
    };

    const unsubOrder = onSnapshot(
      doc(db, COL, id),
      snap => {
        orderReady = true;
        selectedOrder = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        emit();
      },
      onError,
    );
    const unsubDetailed = this.subscribeDetailed(data => {
      detailsReady = true;
      detailedOrders = data;
      emit();
    }, onError);

    return () => {
      unsubOrder();
      unsubDetailed();
    };
  },
};
