// src/hooks/useBranches.js
import { useState, useEffect, useCallback } from 'react';
import { branchService } from '../services/branchService';

export function useBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const unsub = branchService.subscribe(
      data => {
        setBranches(data);
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load branches.');
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const addBranch = useCallback(async (data) => {
    await branchService.add(data);
  }, []);

  const toggleStatus = useCallback(async (id, isOpen) => {
    await branchService.toggleStatus(id, isOpen);
  }, []);

  const removeBranch = useCallback(async (id) => {
    await branchService.remove(id);
  }, []);

  return { branches, loading, error, addBranch, toggleStatus, removeBranch };
}
