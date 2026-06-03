// src/hooks/useOrders.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../services/orderService';

export function useOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scheduledReviewRequests = useRef(new Set());

  useEffect(() => {
    const unsub = orderService.subscribeDetailed(data => {
      setOrders(data);
      setError(null);
      setLoading(false);
      data
        .filter(order => order.status === 'delivered' && !order.reviewRequested)
        .forEach(order => {
          if (scheduledReviewRequests.current.has(order.id)) return;
          const due = order.reviewRequestDueAt?.toDate ? order.reviewRequestDueAt.toDate() : null;
          if (!due) return;
          scheduledReviewRequests.current.add(order.id);
          const delay = Math.max(due.getTime() - Date.now(), 0);
          window.setTimeout(() => {
            void orderService.sendDueReviewRequest(order.id);
          }, delay);
        });
    }, err => {
      setError(err.message || 'Failed to load orders.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    await orderService.updateStatus(id, status);
  }, []);

  const removeOrder = useCallback(async (id) => {
    await orderService.remove(id);
  }, []);

  return { orders, loading, error, updateStatus, removeOrder };
}

/** Hook to watch a single order document in realtime */
export function useOrder(id) {
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const unsub = orderService.subscribeOneDetailed(id, data => {
      setOrder(data);
      setError(null);
      setLoading(false);
    }, err => {
      setError(err.message || 'Failed to load order.');
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const updateStatus = useCallback(async (status) => {
    if (!id) return;
    await orderService.updateStatus(id, status);
  }, [id]);

  const allowCancellation = useCallback(async () => {
    if (!id) return;
    await orderService.allowCancellation(id);
  }, [id]);

  return { order, loading, error, updateStatus, allowCancellation };
}
