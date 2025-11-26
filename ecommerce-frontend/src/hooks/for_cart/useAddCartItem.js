import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

export default function useAddCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { hydrate, setMeta } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

  const addItem = useCallback(async ({ productId, quantity = 1, size = '', colorHex = '' }) => {
    setLoading(true);
    setError(null);

    const headers = { accept: 'application/json', 'Content-Type': 'application/json' };

    const body = {
      product_id: Number(productId),
      quantity: Number(quantity) || 1,
      size: typeof size === 'string' ? size : '',
      color_hex: typeof colorHex === 'string' ? colorHex : '',
    };

    try {
      const res = await apiFetch('/api/cart-items', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
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
      setError(e?.message || 'Failed to add item to cart');
      setLoading(false);
      throw e;
    }
  }, [accessToken, user?.id]);

  return { addItem, loading, error };
}
