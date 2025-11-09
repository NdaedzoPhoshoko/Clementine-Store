import { useCallback, useState } from 'react';
import authStorage from '../use_auth/authStorage.js';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

export default function useDeleteCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          const meta = cached?.meta || {
            totalItems: filtered.reduce((s, it) => s + Number(it.quantity || 0), 0),
            subtotal: filtered.reduce((s, it) => s + (Number(it.price) * Number(it.quantity || 0)), 0),
          };
          localStorage.setItem(
            KEY,
            JSON.stringify({ ts: Date.now(), cart: cached?.cart || null, items: filtered, meta })
          );
        }
      }
    } catch (e) {
      console.warn('[useDeleteCartItem] Cache update failed:', e);
    }
  };

  const deleteItem = useCallback(async (cartItemId) => {
    setLoading(true);
    setError(null);

    const id = String(cartItemId);
    const attempts = [
      `/api/cart-items/${id}`,
      `${API_BASE_URL}/api/cart-items/${id}`,
    ];

    const headers = { accept: '*/*' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      const url = attempts[i];
      try {
        const res = await fetch(url, { method: 'DELETE', headers });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        updateCacheRemove(cartItemId);
        setLoading(false);
        return payload;
      } catch (e) {
        lastErr = e;
      }
    }

    setError(lastErr?.message || 'Failed to delete cart item');
    setLoading(false);
    throw lastErr;
  }, [accessToken, user?.id]);

  return { deleteItem, loading, error };
}