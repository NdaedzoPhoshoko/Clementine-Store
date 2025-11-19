import { useEffect, useMemo, useRef, useState } from 'react';
import authStorage from './use_auth/authStorage.js';
import apiFetch from '../utils/apiFetch.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const cleanImageUrl = (u) => (typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : u || '');

const cacheKey = (userId, page, limit) => `orders-cache:v1:user=${userId ?? 'unknown'}:p=${page}:l=${limit}`;

export default function useFetchMyOrders({ initialPage = 1, limit = 20, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [itemsByPage, setItemsByPage] = useState({});
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const controllerRef = useRef(null);
  const user = authStorage.getUser();
  const signature = useMemo(() => String(user?.id ?? 'unknown'), [user?.id]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const KEY = cacheKey(user?.id, page, limit);

    let usedCache = false;
    let cacheIsStale = true;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          const arr = Array.isArray(cached.items) ? cached.items : [];
          if (arr.length >= 0) {
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
                    name: typeof it.name === 'string' ? it.name : String(it.name || ''),
                    image_url: cleanImageUrl(it.image_url),
                  }))
                : [],
              shipping: o.shipping || null,
              meta: { itemsCount: Number(o?.meta?.itemsCount ?? (Array.isArray(o.items) ? o.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0)), total: toNumber(o?.meta?.total ?? o.total_price) },
            }));
            setItems((prev) => (page === 1 ? normalized : [...prev, ...normalized]));
            setItemsByPage((prev) => ({ ...prev, [page]: normalized }));
            setMeta(cached.meta || null);
            const nextHasMore = typeof cached?.meta?.hasNext !== 'undefined' ? Boolean(cached.meta.hasNext) : (Array.isArray(arr) && arr.length === Number(limit));
            setHasMore(nextHasMore);
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
            if (page === 1) setLoading(false);
            else setLoadingMore(false);
          }
        }
      }
    } catch (_) {}

    const fetchLatest = async () => {
      if (page === 1) setLoading(!usedCache);
      else setLoadingMore(!usedCache);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      try {
        const res = await apiFetch(`/api/orders/my?${params.toString()}`, { headers: { accept: 'application/json' }, signal: controller.signal });
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

        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), items: arr, meta: data?.meta || null }));
          }
        } catch (_) {}

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

    if (!usedCache || cacheIsStale) {
      fetchLatest();
    }

    return () => controller.abort();
  }, [enabled, signature, page, limit]);

  const loadNextPage = () => {
    if (loading || loadingMore || !hasMore) return;
    setPage((p) => Number(p) + 1);
  };

  const refresh = async () => {
    try {
      const KEY = cacheKey(user?.id, page, limit);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(KEY);
      }
    } catch (_) {}
    setLoading((l) => !l);
    setLoading((l) => !l);
  };

  const clearCache = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(`orders-cache:v1:user=${user?.id ?? 'unknown'}`)) localStorage.removeItem(k);
        });
      }
    } catch (_) {}
  };

  return { items, page, pageItems: itemsByPage[page] || [], itemsByPage, hasMore, loading, loadingMore, error, meta, loadNextPage, setPage, refresh, clearCache };
}