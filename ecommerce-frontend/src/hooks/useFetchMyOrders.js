import { useEffect, useMemo, useRef, useState } from 'react';
import authStorage from './use_auth/authStorage.js';
import apiFetch from '../utils/apiFetch.js';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');

export default function useFetchMyOrders({ initialPage = 1, limit = 20, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [itemsByPage, setItemsByPage] = useState({});
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const controllerRef = useRef(null);
  const user = authStorage.getUser();
  const signature = useMemo(() => String(user?.id ?? 'unknown'), [user?.id]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const fetchLatest = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('_t', String(Date.now())); // Cache busting

      try {
        const res = await apiFetch(`/api/orders/my?${params.toString()}`, { 
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
        if (!ct.includes('application/json')) throw new Error(`Unexpected content-type: ${ct}`);
        const data = await res.json();

        const arr = Array.isArray(data?.items) ? data.items : [];
        const normalized = arr.map((o) => ({
          id: o.id,
          user_id: o.user_id,
          total_price: toNumber(o.total_price),
          payment_status: o.payment_status,
          created_at: o.created_at,
          items: Array.isArray(o.items)
            ? o.items.map((it) => ({
                order_item_id: it.order_item_id,
                product_id: it.product_id,
                quantity: Number(it.quantity ?? 0),
                price: toNumber(it.price),
                size: typeof it.size === 'string' ? it.size : String(it.size || ''),
                color_hex: typeof it.color_hex === 'string' ? it.color_hex : String(it.color_hex || ''),
                name: typeof it.name === 'string' ? it.name : String(it.name || ''),
                image_url: cleanImageUrl(it.image_url),
              }))
            : [],
          shipping: o.shipping || null,
          meta: { itemsCount: Number(o?.meta?.itemsCount ?? (Array.isArray(o.items) ? o.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0)), total: toNumber(o?.meta?.total ?? o.total_price) },
        }));

        setItems((prev) => (page === 1 ? normalized : [...prev, ...normalized]));
        setItemsByPage((prev) => ({ ...prev, [page]: normalized }));
        setMeta(data?.meta || null);

        const nextHasMore = typeof data?.meta?.hasNext !== 'undefined' ? Boolean(data.meta.hasNext) : arr.length === Number(limit);
        setHasMore(nextHasMore);

        if (page === 1) setLoading(false);
        else setLoadingMore(false);
        return;
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
        if (page === 1) setLoading(false);
        else setLoadingMore(false);
      }
    };

    fetchLatest();

    return () => controller.abort();
  }, [enabled, signature, page, limit, refreshKey]);

  const loadNextPage = () => {
    if (loading || loadingMore || !hasMore) return;
    setPage((p) => Number(p) + 1);
  };

  const refresh = async () => {
    setRefreshKey((k) => k + 1);
  };

  const clearCache = () => {
    // No-op as caching is removed
  };

  return { items, page, pageItems: itemsByPage[page] || [], itemsByPage, hasMore, loading, loadingMore, error, meta, loadNextPage, setPage, refresh, clearCache };
}
