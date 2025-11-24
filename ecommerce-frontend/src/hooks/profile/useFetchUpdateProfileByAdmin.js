import { useCallback, useState } from 'react';
import apiFetch from '../../utils/apiFetch.js';

// Admin or self update via PUT /api/users/{id}
// Accepts: id (number), fields { name?, email? }
export default function useFetchUpdateProfileByAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const updateById = useCallback(async (id, { name, email } = {}) => {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      const err = new Error('Invalid user id');
      setError(err.message);
      throw err;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...(typeof name !== 'undefined' ? { name } : {}), ...(typeof email !== 'undefined' ? { email } : {}) }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || `Update failed (HTTP ${res.status})`;
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

  return { updateById, loading, error, data };
}