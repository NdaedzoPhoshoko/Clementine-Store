import { useCallback, useState } from 'react';
import authStorage from '../use_auth/authStorage.js';
import useAuthRefresh from '../use_auth/useAuthRefresh.js';

// Prefer Vite proxy (relative) and fall back to absolute base URL
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');
const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));

export default function useAddCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();
  const { refresh: refreshAuth } = useAuthRefresh();

  const writeCache = (data) => {
    try {
      const KEY = cacheKey(user?.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        const itemsNorm = Array.isArray(data?.items)
          ? data.items.map((it) => ({
              cart_item_id: it.cart_item_id,
              product_id: it.product_id,
              name: typeof it.name === 'string' ? it.name : String(it.name || ''),
              description: typeof it.description === 'string' ? it.description : '',
              price: toNumber(it.price),
              image_url: cleanImageUrl(it.image_url),
              stock: Number(it.stock ?? 0),
              category_id: Number(it.category_id ?? 0),
              quantity: Number(it.quantity ?? 0),
              added_at: it.added_at || null,
              size: typeof it.size === 'string' ? it.size : '',
              color_hex: typeof it.color_hex === 'string' ? it.color_hex : '',
            }))
          : [];

        const metaNorm = data?.meta && typeof data.meta === 'object'
          ? { totalItems: Number(data.meta.totalItems ?? itemsNorm.length), subtotal: toNumber(data.meta.subtotal ?? itemsNorm.reduce((s, it) => s + (it.price * it.quantity), 0)) }
          : { totalItems: itemsNorm.length, subtotal: itemsNorm.reduce((s, it) => s + (it.price * it.quantity), 0) };

        localStorage.setItem(
          KEY,
          JSON.stringify({ ts: Date.now(), cart: data?.cart || null, items: itemsNorm, meta: metaNorm })
        );
      }
    } catch (e) {
      console.warn('[useAddCartItem] Cache write failed:', e);
    }
  };

  const addItem = useCallback(async ({ productId, quantity = 1, size = '', colorHex = '' }) => {
    setLoading(true);
    setError(null);

    const attempts = [
      '/api/cart-items',
      `${API_BASE_URL}/api/cart-items`,
    ];

    let headers = { accept: 'application/json', 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const body = {
      product_id: Number(productId),
      quantity: Number(quantity) || 1,
      size: typeof size === 'string' ? size : '',
      color_hex: typeof colorHex === 'string' ? colorHex : '',
    };

    let lastErr = null;
    for (let i = 0; i < attempts.length; i++) {
      const url = attempts[i];
      try {
        let res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        // If unauthorized, attempt silent refresh and retry once
        if (res.status === 401) {
          try {
            await refreshAuth({ silent: true });
            const newToken = authStorage.getAccessToken();
            if (newToken) {
              headers = { ...headers, Authorization: `Bearer ${newToken}` };
              res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            }
          } catch (_) {
            // fall through and handle as unauthorized
          }
        }

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        // Write full response to cart cache for immediate UI sync
        writeCache(payload);
        setLoading(false);
        return payload;
      } catch (e) {
        lastErr = e;
      }
    }

    setError(lastErr?.message || 'Failed to add item to cart');
    setLoading(false);
    throw lastErr;
  }, [accessToken, user?.id, refreshAuth]);

  return { addItem, loading, error };
}