import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

// Consistent with other hooks: support Vite proxy first, then absolute fallback
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Mirror useFetchCart cache key to keep cart cache in sync
const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

export default function useUpdateCartItemQuantity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateItemQuantity } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

  const updateCacheQuantity = (cartItemId, nextQty) => {
    try {
      const KEY = cacheKey(user?.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const items = Array.isArray(cached?.items) ? cached.items : [];
          const updated = items.map((it) =>
            Number(it.cart_item_id) === Number(cartItemId)
              ? { ...it, quantity: Number(nextQty) }
              : it
          );
          const meta = {
            totalItems: updated.reduce((s, it) => s + Number(it.quantity || 0), 0),
            subtotal: updated.reduce((s, it) => s + (Number(it.price) * Number(it.quantity || 0)), 0),
          };
          localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), cart: cached?.cart || null, items: updated, meta }));
        }
      }
    } catch (e) {
      console.warn('[useUpdateCartItemQuantity] Cache update failed:', e);
    }
  };

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
      // Optimistically update cart cache and context for snappy UI
      updateCacheQuantity(cartItemId, nextQty);
      updateItemQuantity(cartItemId, Number(nextQty));
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