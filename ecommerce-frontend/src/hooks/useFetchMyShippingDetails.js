import { useEffect, useMemo, useRef, useState } from 'react';
import authStorage from './use_auth/authStorage.js';
import apiFetch from '../utils/apiFetch.js';

export default function useFetchMyShippingDetails({ initialPage = 1, limit = 20, enabled = true } = {}) {
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

      try {
        const res = await apiFetch(`/api/shipping-details/my?${params.toString()}`, { headers: { accept: 'application/json' }, signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error(`Unexpected content-type: ${ct}`);
        const data = await res.json();

        const arr = Array.isArray(data?.items) ? data.items : [];
        const normalized = arr.map((s) => ({
          id: s.id,
          order_id: s.order_id,
          user_id: s.user_id,
          name: String(s.name || ''),
          address: String(s.address || ''),
          city: String(s.city || ''),
          province: s.province || null,
          postal_code: s.postal_code || null,
          phone_number: s.phone_number || null,
          delivery_status: String(s.delivery_status || ''),
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
    // No-op
  };

  return { items, page, pageItems: itemsByPage[page] || [], itemsByPage, hasMore, loading, loadingMore, error, meta, loadNextPage, setPage, refresh, clearCache };
}
