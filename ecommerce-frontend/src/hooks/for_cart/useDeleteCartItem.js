import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

export default function useDeleteCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { hydrate } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

  const deleteItem = useCallback(async (cartItemId) => {
    setLoading(true);
    setError(null);

    const id = String(cartItemId);
    const headers = { accept: '*/*' };
    try {
      const res = await apiFetch(`/api/cart-items/${id}`, { method: 'DELETE', headers });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      if (Array.isArray(payload?.items) || payload?.meta) {
        hydrate({ items: payload.items, meta: payload.meta });
      }
      setLoading(false);
      return payload;
    } catch (e) {
      setError(e?.message || 'Failed to delete cart item');
      setLoading(false);
      throw e;
    }
  }, [accessToken, user?.id]);

  return { deleteItem, loading, error };
}
