import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

export default function useDeleteCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { hydrate } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

  const updateCacheRemove = (cartItemId) => {
    try {
      const KEY = cacheKey(user?.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const items = Array.isArray(cached?.items) ? cached.items : [];
          const filtered = items.filter((it) => Number(it.cart_item_id) !== Number(cartItemId));
          const meta = {
            totalItems: filtered.reduce((s, it) => s + Number(it.quantity || 0), 0),
            subtotal: filtered.reduce((s, it) => s + (Number(it.price) * Number(it.quantity || 0)), 0),
          };
          localStorage.setItem(
            KEY,
            JSON.stringify({ ts: Date.now(), cart: cached?.cart || null, items: filtered, meta })
          );
          return { items: filtered, meta };
        }
      }
    } catch (e) {
      console.warn('[useDeleteCartItem] Cache update failed:', e);
    }
    return null;
  };

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
      const normalized = updateCacheRemove(cartItemId);
      if (normalized) {
        hydrate(normalized);
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