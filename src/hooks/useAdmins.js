// src/hooks/useAdmins.js
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';

export function useAdmins() {
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const unsub = adminService.subscribe(
      data => {
        setAdmins(data);
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load admins.');
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const addAdmin = useCallback(async (data) => {
    await adminService.add(data);
  }, []);

  const updateAdmin = useCallback(async (id, data) => {
    await adminService.update(id, data);
  }, []);

  const removeAdmin = useCallback(async (id) => {
    await adminService.remove(id);
  }, []);

  return { admins, loading, error, addAdmin, updateAdmin, removeAdmin };
}
