import { useState, useCallback, useEffect } from 'react';
import { authStorage } from './authStorage';

// Global session expiry event
export const SESSION_EXPIRED_EVENT = 'auth:session_expired';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export default function useAuthRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async (options = {}) => {
    const { silent = false, emitEvent = !silent } = options;
    
    if (!silent) {
      setLoading(true);
      setError(null);
      setData(null);
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { accept: '*/*' },
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || payload?.error || 'Session expired, please sign in again.';
        // Dispatch session expired event with message unless suppressed
        if (emitEvent) {
          window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
        }
        throw new Error(message);
      }
      // If server returns new tokens, persist them; otherwise just store the message
      if (payload?.accessToken || payload?.token || payload?.user) {
        authStorage.setAuth({ user: payload.user, token: payload.token, accessToken: payload.accessToken });
      }
      if (!silent) {
        setData(payload);
      }
      return payload;
    } catch (e) {
      if (!silent) {
        setError(e?.message || 'Unknown error');
      }
      throw e;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  return { refresh, loading, error, data };
}