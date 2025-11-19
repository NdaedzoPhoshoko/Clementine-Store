import { useCallback, useState } from 'react';
import authStorage from './use_auth/authStorage.js';
import apiFetch from '../utils/apiFetch.js';

export default function useUpdateOrderShipping() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const invalidateOrdersCache = useCallback((userId) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(`orders-cache:v1:user=${userId ?? 'unknown'}`)) localStorage.removeItem(k);
        });
      }
    } catch (_) {}
  }, []);

  const update = useCallback(async (orderId, fields, { invalidateCache = true } = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/shipping`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Unexpected content-type');
      const data = await res.json();
      setResult(data);
      const user = authStorage.getUser();
      if (invalidateCache) invalidateOrdersCache(user?.id);
      setLoading(false);
      return data;
    } catch (e) {
      setError(e);
      setLoading(false);
      return null;
    }
  }, [invalidateOrdersCache]);

  return { update, loading, error, result };
}