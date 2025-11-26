import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

export default function useUpdateCartItemQuantity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateItemQuantity, setMeta } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

  const updateQuantity = useCallback(async (cartItemId, nextQty) => {
    setLoading(true);
    setError(null);
    
    const id = String(cartItemId);
    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    try {
      const res = await apiFetch(`/api/cart-items/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity: Number(nextQty) }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      updateItemQuantity(cartItemId, Number(nextQty));
      if (Array.isArray(payload?.items) || payload?.meta) {
        setMeta(payload?.meta);
      }
      setLoading(false);
      return payload;
    } catch (e) {
      setError(e?.message || 'Failed to update quantity');
      setLoading(false);
      throw e;
    }
  }, [accessToken, user?.id]);

  return { updateQuantity, loading, error };
}
