import { useEffect, useRef, useState, useMemo } from 'react';
import authStorage from '../use_auth/authStorage.js';
import apiFetch from '../../utils/apiFetch.js';

const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');
const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));

export default function useFetchCart({ enabled = true } = {}) {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const controllerRef = useRef(null);

  const user = authStorage.getUser();
  const signature = useMemo(() => String(user?.id ?? 'guest'), [user?.id]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const fetchLatest = async () => {
      setError(null);
      setLoading(true);
      try {
        const timestamp = Date.now();
        const res = await apiFetch(`/api/cart?_t=${timestamp}`, { 
          headers: { 
            accept: 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }, 
          signal: controller.signal 
        });
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
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err?.message || 'Failed to fetch cart');
        setLoading(false);
      }
    };

    fetchLatest();
    return () => controller.abort();
  }, [enabled, signature, refreshKey]);

  useEffect(() => {
    const onAuthChanged = () => {
      setRefreshKey((k) => k + 1);
    };
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === 'auth:user' || e.key === 'auth:accessToken') setRefreshKey((k) => k + 1);
    };
    const onCartRefresh = () => {
      setRefreshKey((k) => k + 1);
    };
    try { window.addEventListener('auth:changed', onAuthChanged); } catch {}
    try { window.addEventListener('storage', onStorage); } catch {}
    try { window.addEventListener('cart:refresh', onCartRefresh); } catch {}
    return () => {
      try { window.removeEventListener('auth:changed', onAuthChanged); } catch {}
      try { window.removeEventListener('storage', onStorage); } catch {}
      try { window.removeEventListener('cart:refresh', onCartRefresh); } catch {}
    };
  }, []);

  const refresh = async () => {
    setRefreshKey((k) => k + 1);
  };

  const clearCache = () => {};

  return { cart, items, meta, loading, error, refresh, clearCache };
}
