// src/hooks/useDeals.js
import { useState, useEffect, useCallback } from 'react';
import { dealService } from '../services/dealService';

export function useDeals() {
  const [deals, setDeals]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDeals = useCallback(async () => {
    try {
      const data = await dealService.getAll();
      setDeals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void fetchDeals(); });
  }, [fetchDeals]);

  const addDeal = useCallback(async (data) => {
    await dealService.add(data);
    await fetchDeals();
  }, [fetchDeals]);

  const toggleActive = useCallback(async (id, isActive) => {
    await dealService.toggleActive(id, isActive);
    setDeals(prev => prev.map(d => d.id === id ? { ...d, isActive } : d));
  }, []);

  const removeDeal = useCallback(async (id) => {
    await dealService.remove(id);
    setDeals(prev => prev.filter(d => d.id !== id));
  }, []);

  return { deals, loading, error, addDeal, toggleActive, removeDeal, refetch: fetchDeals };
}
