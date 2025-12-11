import { useEffect, useRef, useState } from 'react';
import apiFetch from '../utils/apiFetch.js';
import authStorage from './use_auth/authStorage.js';

export default function useFetchMe({ enabled = true } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    const fetchMe = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await apiFetch('/api/users/me', { headers: { accept: 'application/json' }, signal: controller.signal });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = payload?.message || `HTTP ${res.status}`;
          throw new Error(message);
        }
        authStorage.setUser(payload);
        setData(payload);
        setLoading(false);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e);
        setLoading(false);
      }
    };
    fetchMe();
    return () => controller.abort();
  }, [enabled, refreshKey]);

  const refresh = async () => {
    setRefreshKey((k) => k + 1);
  };

  return { data, loading, error, refresh };
}

