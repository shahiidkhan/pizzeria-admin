// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const error = null;

  useEffect(() => {
    const unsub = productService.subscribe(data => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addProduct = useCallback(async (data) => {
    await productService.add(data);
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    await productService.update(id, data);
  }, []);

  const removeProduct = useCallback(async (id) => {
    await productService.remove(id);
  }, []);

  const toggleAvailability = useCallback(async (id, value) => {
    await productService.toggleAvailability(id, value);
  }, []);

  return { products, loading, error, addProduct, updateProduct, removeProduct, toggleAvailability };
}
