// src/hooks/useReviews.js
import { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService';

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewService.getAll();
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = reviewService.subscribe(
      data => {
        setReviews(data);
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const removeReview = useCallback(async (id) => {
    await reviewService.remove(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  return { reviews, loading, error, removeReview, refetch: fetchReviews };
}
