import { useCallback, useState } from 'react';
import apiFetch from '../../utils/apiFetch.js';

export default function useFetchOrderTrackingPublic() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const trackOrder = useCallback(async (orderId, email) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Backend expects /api/orders/track/:id
      const timestamp = Date.now();
      const res = await apiFetch(`/api/orders/track/${orderId}?_t=${timestamp}`, {
        method: 'GET',
        headers: { 
          accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      const payload = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const message = payload?.message || `Tracking failed (HTTP ${res.status})`;
        throw new Error(message);
      }
      
      setData(payload);
      return payload;
    } catch (e) {
      setError(e?.message || 'Failed to track order');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trackOrder, loading, error, data };
}
