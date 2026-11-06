import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NOTIFICATION_TYPES, notificationService } from '../services/notificationService';

const ORDER_NOTIFICATION_TYPES = new Set([
  NOTIFICATION_TYPES.NEW_ORDER,
  NOTIFICATION_TYPES.PROCESSING,
  NOTIFICATION_TYPES.ON_WAY,
  NOTIFICATION_TYPES.DELIVERED,
  NOTIFICATION_TYPES.CANCELLED,
  NOTIFICATION_TYPES.RECEIVED_CONFIRMATION,
]);

const REVIEW_NOTIFICATION_TYPES = new Set([
  NOTIFICATION_TYPES.NEW_REVIEW,
]);

const BELL_SEEN_STORAGE_KEY = 'pizzeria:admin:bellSeenNotificationKeys';

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeNotificationType(notification) {
  const rawType = normalizeText(notification?.type);
  const title = normalizeText(notification?.title || notification?.text);
  const message = normalizeText(notification?.message || notification?.body);
  const combined = `${rawType} ${title} ${message}`;

  if (rawType === NOTIFICATION_TYPES.NEW_ORDER || title.includes('new order')) {
    return NOTIFICATION_TYPES.NEW_ORDER;
  }

  if (
    rawType === NOTIFICATION_TYPES.RECEIVED_CONFIRMATION ||
    rawType.includes('received_confirmation') ||
    rawType.includes('delivery_confirmation') ||
    title.includes('delivery confirmed') ||
    message.includes('confirmed order delivery') ||
    message.includes('order reached successfully')
  ) {
    return NOTIFICATION_TYPES.RECEIVED_CONFIRMATION;
  }

  if (rawType === NOTIFICATION_TYPES.CANCELLED || combined.includes('cancel')) {
    return NOTIFICATION_TYPES.CANCELLED;
  }

  if (rawType === NOTIFICATION_TYPES.PROCESSING || combined.includes('processing')) {
    return NOTIFICATION_TYPES.PROCESSING;
  }

  if (rawType === NOTIFICATION_TYPES.ON_WAY || combined.includes('on delivery') || combined.includes('on the way')) {
    return NOTIFICATION_TYPES.ON_WAY;
  }

  if (rawType === NOTIFICATION_TYPES.DELIVERED || combined.includes('delivered')) {
    return NOTIFICATION_TYPES.DELIVERED;
  }

  if (rawType === NOTIFICATION_TYPES.NEW_REVIEW || title.includes('new review')) {
    return NOTIFICATION_TYPES.NEW_REVIEW;
  }

  return rawType || 'notification';
}

function isOrderNotification(notification) {
  const normalizedType = normalizeNotificationType(notification);
  return Boolean(
    notification?.orderId ||
    ORDER_NOTIFICATION_TYPES.has(normalizedType) ||
    normalizedType.startsWith('order_')
  );
}

function isReviewNotification(notification) {
  const normalizedType = normalizeNotificationType(notification);
  return Boolean(
    notification?.reviewId ||
    REVIEW_NOTIFICATION_TYPES.has(normalizedType)
  );
}

function isAdminNotification(notification) {
  const normalizedType = normalizeNotificationType(notification);
  const recipient = String(
    notification?.userId ||
    notification?.audience ||
    notification?.recipient ||
    notification?.recipientRole ||
    notification?.targetRole ||
    notification?.role ||
    ''
  ).toLowerCase();

  return (
    recipient === 'admin' ||
    recipient === 'admins' ||
    recipient === 'super_admin' ||
    recipient === 'super admin' ||
    notification?.admin === true ||
    notification?.forAdmin === true ||
    normalizedType === NOTIFICATION_TYPES.NEW_ORDER ||
    normalizedType === NOTIFICATION_TYPES.RECEIVED_CONFIRMATION ||
    normalizedType === NOTIFICATION_TYPES.NEW_REVIEW
  );
}

function notificationDedupeKey(notification) {
  const normalizedType = normalizeNotificationType(notification);
  if (notification?.reviewId) {
    return `review:${notification.reviewId}:${normalizedType}`;
  }
  if (notification?.orderId) {
    return `order:${notification.orderId}:${normalizedType}`;
  }
  return notification?.id;
}

function readBellSeenKeys() {
  if (typeof window === 'undefined') return new Set();

  try {
    const value = window.localStorage.getItem(BELL_SEEN_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function persistBellSeenKeys(keys) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BELL_SEEN_STORAGE_KEY, JSON.stringify([...keys].slice(-300)));
  } catch {
    // Local acknowledgement is a UI convenience; Firestore remains the source of truth.
  }
}

function sortByCreatedAtDesc(a, b) {
  return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
}

function dedupeNotifications(items) {
  const byKey = new Map();

  [...items].sort(sortByCreatedAtDesc).forEach(notification => {
    const key = notificationDedupeKey(notification);
    if (!key) return;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, notification);
      return;
    }

    if (existing.read && !notification.read) {
      byKey.set(key, notification);
    }
  });

  return [...byKey.values()].sort(sortByCreatedAtDesc);
}

function playNotificationSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.16);

  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.24);
  oscillator.onended = () => audioContext.close();
}

export function useAdminActivity(enabled = true) {
  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bellSeenKeys, setBellSeenKeys] = useState(readBellSeenKeys);
  const knownUnreadIdsRef = useRef(new Set());
  const initialSnapshotSeenRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      knownUnreadIdsRef.current = new Set();
      initialSnapshotSeenRef.current = false;
      return undefined;
    }

    const unsub = notificationService.subscribeAdmin(
      data => {
        setRawNotifications(data);
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load notifications.');
        setLoading(false);
      },
    );

    return () => unsub();
  }, [enabled]);

  const notifications = useMemo(
    () => dedupeNotifications(rawNotifications.filter(isAdminNotification)),
    [rawNotifications],
  );

  const bellUnreadNotifications = useMemo(
    () => notifications.filter(notification => {
      const key = notificationDedupeKey(notification);
      return !notification.read && key && !bellSeenKeys.has(key);
    }),
    [bellSeenKeys, notifications],
  );

  const orderUnreadNotifications = useMemo(
    () => notifications.filter(notification => !notification.read && isOrderNotification(notification)),
    [notifications],
  );

  const reviewUnreadNotifications = useMemo(
    () => notifications.filter(notification => !notification.read && isReviewNotification(notification)),
    [notifications],
  );

  useEffect(() => {
    if (!enabled) {
      knownUnreadIdsRef.current = new Set();
      initialSnapshotSeenRef.current = false;
      return;
    }

    if (loading) return;

    const unreadKeys = new Set(
      notifications
        .filter(notification => !notification.read)
        .map(notificationDedupeKey)
    );

    if (!initialSnapshotSeenRef.current) {
      knownUnreadIdsRef.current = unreadKeys;
      initialSnapshotSeenRef.current = true;
      return;
    }

    const hasNewUnread = [...unreadKeys].some(key => !knownUnreadIdsRef.current.has(key));
    knownUnreadIdsRef.current = unreadKeys;

    if (!hasNewUnread) return;

    try {
      playNotificationSound();
    } catch {
      // Browsers can block audio before the admin interacts with the page.
    }
  }, [enabled, loading, notifications]);

  const markOrderNotificationsAsRead = useCallback(async () => {
    const orderKeys = new Set(orderUnreadNotifications.map(notificationDedupeKey));
    const unreadIds = rawNotifications
      .filter(notification => !notification.read)
      .filter(notification => orderKeys.has(notificationDedupeKey(notification)))
      .map(notification => notification.id);
    await notificationService.markAllAsRead(unreadIds);
  }, [orderUnreadNotifications, rawNotifications]);

  const markReviewNotificationsAsRead = useCallback(async () => {
    const reviewKeys = new Set(reviewUnreadNotifications.map(notificationDedupeKey));
    const unreadIds = rawNotifications
      .filter(notification => !notification.read)
      .filter(notification => reviewKeys.has(notificationDedupeKey(notification)))
      .map(notification => notification.id);
    await notificationService.markAllAsRead(unreadIds);
  }, [rawNotifications, reviewUnreadNotifications]);

  const acknowledgeBellNotifications = useCallback(() => {
    const unreadKeys = notifications
      .filter(notification => !notification.read)
      .map(notificationDedupeKey)
      .filter(Boolean);

    if (unreadKeys.length === 0) return;

    setBellSeenKeys(previous => {
      const next = new Set(previous);
      unreadKeys.forEach(key => next.add(key));
      persistBellSeenKeys(next);
      return next;
    });
  }, [notifications]);

  const markAsRead = useCallback(async (id) => {
    const selected = rawNotifications.find(notification => notification.id === id);
    if (!selected) return;

    const selectedKey = notificationDedupeKey(selected);
    if (selectedKey) {
      setBellSeenKeys(previous => {
        const next = new Set(previous);
        next.add(selectedKey);
        persistBellSeenKeys(next);
        return next;
      });
    }

    const unreadIds = rawNotifications
      .filter(notification => !notification.read)
      .filter(notification => notificationDedupeKey(notification) === selectedKey)
      .map(notification => notification.id);

    if (unreadIds.length > 1) {
      await notificationService.markAllAsRead(unreadIds);
      return;
    }

    await notificationService.markAsRead(id);
  }, [rawNotifications]);

  const markAllAsRead = useCallback(async () => {
    const visibleKeys = new Set(notifications.map(notificationDedupeKey));
    const unreadIds = rawNotifications
      .filter(notification => !notification.read)
      .filter(notification => visibleKeys.has(notificationDedupeKey(notification)))
      .map(notification => notification.id);
    await notificationService.markAllAsRead(unreadIds);
  }, [notifications, rawNotifications]);

  if (!enabled) {
    return {
      notifications: [],
      unreadCount: 0,
      orderUnreadCount: 0,
      reviewUnreadCount: 0,
      loading: false,
      error: null,
      markAsRead,
      markAllAsRead,
      acknowledgeBellNotifications,
      markOrderNotificationsAsRead,
      markReviewNotificationsAsRead,
    };
  }

  return {
    notifications,
    unreadCount: bellUnreadNotifications.length,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    acknowledgeBellNotifications,
    orderUnreadCount: orderUnreadNotifications.length,
    reviewUnreadCount: reviewUnreadNotifications.length,
    markOrderNotificationsAsRead,
    markReviewNotificationsAsRead,
  };
}
