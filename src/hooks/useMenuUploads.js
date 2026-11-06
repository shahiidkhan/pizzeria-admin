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

  const setActiveUpload = useCallback(async (id) => {
    await menuService.setActiveUpload(id);
  }, []);

  const removeUpload = useCallback(async (upload) => {
    await menuService.removeUpload(upload);
  }, []);

  return { uploads, loading, error, uploadMenu, setActiveUpload, removeUpload };
}
