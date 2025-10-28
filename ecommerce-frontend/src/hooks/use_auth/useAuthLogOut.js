import { useState, useCallback } from 'react';
import { authStorage } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export default function useAuthLogOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { accept: '*/*' },
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      // Clear local auth state regardless of server response
      authStorage.clear();
      if (!res.ok) {
        const message = payload?.message || payload?.error || 'Logout failed';
        throw new Error(message);
      }
      setData(payload);
      return payload;
    } catch (e) {
      setError(e?.message || 'Unknown error');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { logout, loading, error, data };
}