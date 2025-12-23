import { useCallback, useState } from 'react';
import apiFetch from '../../../utils/apiFetch.js';

export default function useAdjustInventoryBatch() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const adjustBatch = useCallback(async (itemsOrPayload) => {
    setPending(true);
    setError(null);
    setData(null);
    try {
      const items = Array.isArray(itemsOrPayload)
        ? itemsOrPayload
        : (Array.isArray(itemsOrPayload?.items) ? itemsOrPayload.items : []);
      if (!items.length) throw new Error('No adjustments to submit');

      const res = await apiFetch('/api/inventory-logs/adjust/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.message || `HTTP ${res.status}`;
        throw new Error(message);
      }
      setData(payload);
      return payload;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setPending(false);
    }
  }, []);

  return { adjustBatch, pending, error, data };
}

