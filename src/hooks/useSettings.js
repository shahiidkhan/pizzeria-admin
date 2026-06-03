import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState(settingsService.defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsub = settingsService.subscribe(
      data => {
        setSettings(data);
        setLoading(false);
      },
      err => {
        setError(err.message || 'Failed to load settings.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveSettings = useCallback(async (data) => {
    setSaving(true);
    setError(null);
    setSuccess('');
    try {
      await settingsService.upsert(data);
      setSuccess('Settings saved.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, success, saveSettings };
}

