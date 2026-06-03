/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  useEffect(() => {
    const unsub = authService.subscribe(async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);
      try {
        const nextAdmin = await authService.resolveAdmin(nextUser);
        if (!nextAdmin) {
          await authService.logout();
          setUser(null);
          setAdmin(null);
        } else {
          setAdmin(nextAdmin);
        }
      } catch {
        setUser(null);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = useCallback(async () => {
    setLogoutError(null);
    setLoggingOut(true);
    try {
      await authService.logout();
      setUser(null);
      setAdmin(null);
    } catch (err) {
      const message = err?.message || 'Failed to sign out. Please try again.';
      setLogoutError(message);
      throw err;
    } finally {
      setLoggingOut(false);
    }
  }, []);

  const clearLogoutError = useCallback(() => setLogoutError(null), []);

  const value = useMemo(
    () => ({
      user,
      admin,
      loading,
      loggingOut,
      logoutError,
      logout,
      clearLogoutError,
    }),
    [user, admin, loading, loggingOut, logoutError, logout, clearLogoutError]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
