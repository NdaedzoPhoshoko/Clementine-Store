import { useCallback, useState } from 'react';
import { useCart } from './CartContext.jsx';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

// Prefer Vite proxy (relative) and fall back to absolute base URL
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');
const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));

export default function useAddCartItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { hydrate, setMeta } = useCart();

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();

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
        const normalized = { items: itemsNorm, meta: metaNorm };
        localStorage.setItem(
          KEY,
          JSON.stringify({ ts: Date.now(), cart: data?.cart || null, ...normalized })
        );
        return normalized;
      }
    } catch (e) {
      console.warn('[useAddCartItem] Cache write failed:', e);
    }
    return null;
  };

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
      // Write full response to cart cache and hydrate context for instant navbar update
      const normalized = writeCache(payload);
      if (normalized) {
        hydrate(normalized);
      } else {
        // Optimistic fallback: bump meta.totalItems when server payload lacks full cart
        try {
          const KEY = cacheKey(user?.id);
          const raw = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(KEY) : null;
          const cached = raw ? JSON.parse(raw) : null;
          const priorItems = Array.isArray(cached?.items) ? cached.items : [];
          const priorTotal = priorItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
          const nextMeta = {
            totalItems: priorTotal + Number(quantity || 1),
            subtotal: cached?.meta?.subtotal ?? priorItems.reduce((s, it) => s + (Number(it.price) * Number(it.quantity || 0)), 0),
          };
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), cart: cached?.cart || null, items: priorItems, meta: nextMeta }));
          }
          setMeta(nextMeta);
        } catch {}
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