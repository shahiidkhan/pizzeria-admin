// src/hooks/useCategories.js
import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const error = null;

  useEffect(() => {
    const unsub = categoryService.subscribe(data => {
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addCategory = useCallback(async (data) => {
    await categoryService.add(data);
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    await categoryService.update(id, data);
  }, []);

  const removeCategory = useCallback(async (id) => {
    await categoryService.remove(id);
  }, []);

  return { categories, loading, error, addCategory, updateCategory, removeCategory };
}
