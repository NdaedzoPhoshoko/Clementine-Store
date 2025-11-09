import { useEffect, useRef, useState, useMemo } from 'react';
import authStorage from '../use_auth/authStorage.js';
import useAuthRefresh from '../use_auth/useAuthRefresh.js';

// Cart data changes frequently; use a shorter TTL than product listings
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');
const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));

const cacheKey = (userId) => `cart-cache:v1:user=${userId ?? 'unknown'}`;

export default function useFetchCart({ enabled = true } = {}) {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  const user = authStorage.getUser();
  const accessToken = authStorage.getAccessToken();
  const { refresh: refreshAuth } = useAuthRefresh();
  const signature = useMemo(() => String(user?.id ?? 'unknown'), [user?.id]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const KEY = cacheKey(user?.id);

    let usedCache = false;
    let cacheIsStale = true;

    // Try cache first
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          if (cached && cached.cart && Array.isArray(cached.items)) {
            setCart(cached.cart);
            setItems(cached.items);
            setMeta(cached.meta || { totalItems: cached.items.length, subtotal: cached.items.reduce((s, it) => s + (toNumber(it.price) * Number(it.quantity || 0)), 0) });
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchCart] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      setError(null);
      setLoading(!usedCache);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const attempts = [
        '/api/cart', // Vite proxy
        `${base}/api/cart`, // Absolute fallback
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          let headers = { accept: 'application/json' };
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

          let res = await fetch(url, { headers, signal: controller.signal });

          // If unauthorized, attempt silent refresh and retry once
          if (res.status === 401) {
            try {
              await refreshAuth({ silent: true });
              const newToken = authStorage.getAccessToken();
              if (newToken) {
                headers = { ...headers, Authorization: `Bearer ${newToken}` };
                res = await fetch(url, { headers, signal: controller.signal });
              }
            } catch (_) {
              // fall through and handle as unauthorized
            }
          }

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();

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

          setCart(data?.cart || null);
          setItems(itemsNorm);
          setMeta(metaNorm);

          // Cache write
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), cart: data?.cart || null, items: itemsNorm, meta: metaNorm }));
            }
          } catch (e) {
            console.warn('[useFetchCart] Cache write failed:', e);
          }

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          if (i === attempts.length - 1) {
            setError(err?.message || 'Failed to fetch cart');
            setLoading(false);
          }
        }
      }
    };

    if (!usedCache || cacheIsStale) {
      fetchLatest();
    }

    return () => controller.abort();
    // Re-run when the user identity changes or enabled toggles
  }, [enabled, signature]);

  const refresh = async () => {
    // Force a refresh by clearing cache and toggling enabled
    try {
      const KEY = cacheKey(user?.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(KEY);
      }
    } catch {}
    // Retrigger effect by touching a dummy state
    setLoading((l) => !l);
    setLoading((l) => !l);
  };

  const clearCache = () => {
    try {
      const KEY = cacheKey(user?.id);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(KEY);
      }
    } catch {}
  };

  return { cart, items, meta, loading, error, refresh, clearCache };
}