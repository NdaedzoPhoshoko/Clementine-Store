import { useCallback, useState } from 'react';
import apiFetch from '../../utils/apiFetch.js';
import authStorage from '../use_auth/authStorage.js';

// Updates the currently signed-in user's profile via PUT /api/users/me
// Accepts partial fields: { name?, email? }
export default function useFetchUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const update = useCallback(async ({ name, email } = {}) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiFetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...(typeof name !== 'undefined' ? { name } : {}), ...(typeof email !== 'undefined' ? { email } : {}) }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || `Update failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      // Update local stored user if present
      const current = authStorage.getUser();
      if (current && payload?.id) {
        const nextUser = { ...current };
        if (typeof payload.name !== 'undefined') nextUser.name = payload.name;
        if (typeof payload.email !== 'undefined') nextUser.email = payload.email;
        authStorage.setUser(nextUser);
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

  return { update, loading, error, data };
}