import { useState, useCallback } from 'react';
import { authStorage } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export default function useAuthRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const register = useCallback(async ({ name, email, password }) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || payload?.error || 'Registration failed';
        throw new Error(message);
      }
      // Persist user and tokens if provided
      if (payload?.user || payload?.token || payload?.accessToken) {
        authStorage.setAuth({ user: payload.user, token: payload.token, accessToken: payload.accessToken });
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

  return { register, loading, error, data };
}