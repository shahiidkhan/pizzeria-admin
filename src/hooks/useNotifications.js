import { useMemo, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export function useNotifications(options = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId, limitToUnread, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const unsub = notificationService.subscribe(
      data => {
        setNotifications(data);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load notifications.');
        setLoading(false);
      },
      { userId, limitToUnread },
    );
    return () => unsub();
  }, [userId, limitToUnread, enabled]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, n) => count + (n.read ? 0 : 1), 0),
    [notifications]
  );

  const markAsRead = useCallback(async (id) => {
    await notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await notificationService.markAllAsRead(unreadIds);
  }, [notifications]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead };
}
