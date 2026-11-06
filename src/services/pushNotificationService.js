import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messagingPromise } from '../firebase/firebase';

const TOKENS_COL = 'fcmTokens';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function tokenDoc(token) {
  return doc(db, TOKENS_COL, encodeURIComponent(token));
}

function tokenRef() {
  return collection(db, TOKENS_COL);
}

function getPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

export const pushNotificationService = {
  getPermission,

  isConfigured() {
    return Boolean(VAPID_KEY);
  },

  async registerAdmin(admin, authUser) {
    const messaging = await messagingPromise;
    if (!messaging || !VAPID_KEY) return null;

    const permission = getPermission();
    if (permission !== 'granted') return null;

    const serviceWorkerRegistration = await getServiceWorkerRegistration();
    if (!serviceWorkerRegistration) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });
    if (!token) return null;

    const ownerId = authUser?.uid || admin?.uid || admin?.id || null;
    const ownerEmail = authUser?.email || admin?.email || null;

    try {
      const oldTokens = await getDocs(query(
        tokenRef(),
        where('role', '==', 'admin'),
        where('platform', '==', 'web'),
        where('ownerId', '==', ownerId),
      ));
      const batch = writeBatch(db);
      let staleCount = 0;
      oldTokens.docs.forEach(tokenSnap => {
        const data = tokenSnap.data();
        if (data.token === token) return;
        batch.delete(tokenSnap.ref);
        staleCount += 1;
      });
      if (staleCount > 0) await batch.commit();
    } catch {
      // Token cleanup is best-effort; registration should still succeed.
    }

    await setDoc(tokenDoc(token), {
      token,
      userId: 'admin',
      role: 'admin',
      ownerId,
      ownerEmail,
      platform: 'web',
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    return token;
  },

  async requestAdminPermission(admin, authUser) {
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return this.registerAdmin(admin, authUser);
  },

  async unregister(token) {
    if (!token) return;
    await deleteDoc(tokenDoc(token));
  },

  async subscribeForeground(callback) {
    const messaging = await messagingPromise;
    if (!messaging) return () => {};
    return onMessage(messaging, callback);
  },
};
