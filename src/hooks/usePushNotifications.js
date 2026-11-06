import { useCallback, useEffect, useRef, useState } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';

const displayedForegroundNotifications = new Set();
const FOREGROUND_DEDUPE_TTL_MS = 60 * 1000;

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

function foregroundNotificationKey(payload) {
  const data = payload?.data || {};
  const normalizedType = normalizePayloadType(data);
  if (data.reviewId && normalizedType) return `review:${data.reviewId}:${normalizedType}:${data.userId || ''}`;
  if (data.orderId && normalizedType) return `order:${data.orderId}:${normalizedType}:${data.userId || ''}`;
  if (data.notificationId) return data.notificationId;
  return payload?.messageId || `${data.title || ''}:${data.message || data.body || ''}`;
}

function claimForegroundNotification(key) {
  if (!key) return true;
  if (displayedForegroundNotifications.has(key)) return false;

  displayedForegroundNotifications.add(key);

  try {
    const storageKey = `pizzeria:foreground-notification:${key}`;
    const lastShownAt = Number(window.localStorage.getItem(storageKey) || 0);
    if (lastShownAt && Date.now() - lastShownAt < FOREGROUND_DEDUPE_TTL_MS) return false;
    window.localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    // Private browsing or storage limits should not block notifications.
  }

  return true;
}

export function usePushNotifications(admin, authUser) {
  const [permission, setPermission] = useState(pushNotificationService.getPermission());
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [enabling, setEnabling] = useState(false);
  const displayedKeysRef = useRef(displayedForegroundNotifications);
  const configured = pushNotificationService.isConfigured();

  const enable = useCallback(async () => {
    if (!admin || !authUser || !configured) return null;
    setEnabling(true);
    try {
      const nextToken = await pushNotificationService.requestAdminPermission(admin, authUser);
      setToken(nextToken);
      setPermission(pushNotificationService.getPermission());
      setError(null);
      return nextToken;
    } catch (err) {
      setError(err?.message || 'Failed to enable push notifications.');
      return null;
    } finally {
      setEnabling(false);
    }
  }, [admin, authUser, configured]);

  useEffect(() => {
    let mounted = true;

    async function register() {
      if (!admin || !authUser || !configured) return;
      if (pushNotificationService.getPermission() !== 'granted') return;

      try {
        const nextToken = await pushNotificationService.registerAdmin(admin, authUser);
        if (!mounted) return;
        setToken(nextToken);
        setPermission(pushNotificationService.getPermission());
        setError(null);
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to enable push notifications.');
      }
    }

    void register();

    return () => {
      mounted = false;
    };
  }, [admin, authUser, configured]);

  useEffect(() => {
    let unsubscribe = null;
    let cancelled = false;
    let mounted = true;

    if (!admin || !authUser || !configured) {
      return () => {
        mounted = false;
        cancelled = true;
      };
    }

    pushNotificationService.subscribeForeground(payload => {
      if (!mounted || pushNotificationService.getPermission() !== 'granted') return;
      const title = payload.notification?.title || payload.data?.title;
      const body = payload.notification?.body || payload.data?.body || payload.data?.message;
      if (!title) return;

      const key = foregroundNotificationKey(payload);
      if (key && displayedKeysRef.current.has(key)) return;
      if (!claimForegroundNotification(key)) return;
      if (key) displayedKeysRef.current.add(key);

      new Notification(title, {
        body,
        tag: key || payload.data?.orderId || payload.messageId,
        data: payload.data,
      });
    }).then(unsub => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    }).catch(err => {
      if (mounted) setError(err?.message || 'Failed to listen for push notifications.');
    });

    return () => {
      mounted = false;
      cancelled = true;
      unsubscribe?.();
    };
  }, [admin, authUser, configured]);

  return {
    configured,
    enabling,
    enable,
    error,
    permission,
    token,
  };
}
