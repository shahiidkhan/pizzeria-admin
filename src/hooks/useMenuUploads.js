import { useCallback, useEffect, useState } from 'react';
import { menuService } from '../services/menuService';

export function useMenuUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = menuService.subscribeUploads(
      data => {
        setUploads(data);
        setError(null);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load uploaded menus.');
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const uploadMenu = useCallback(async (file, uploadedBy, onProgress) => {
    await menuService.uploadMenu(file, uploadedBy, onProgress);
  }, []);

  return { uploads, loading, error, uploadMenu };
}
