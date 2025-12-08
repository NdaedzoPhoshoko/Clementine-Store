import { useEffect, useMemo, useRef, useState } from 'react';

export default function useFetchBrowseProducts({
  initialPage = 1,
  limit = 12,
  search = '',
  categoryId,
  minPrice,
  maxPrice,
  inStock,
  enabled = true,
  showSkeletonOnRefresh = false,
} = {}) {
  const [items, setItems] = useState([]);
  const [itemsByPage, setItemsByPage] = useState({});
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [meta, setMeta] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Signature of all params except page — when it changes, reset listing
  const signature = useMemo(
    () =>
      [
        String(limit),
        String(search || ''),
        String(categoryId ?? 'na'),
        String(minPrice ?? 'na'),
        String(maxPrice ?? 'na'),
        typeof inStock === 'undefined' || inStock === null ? 'na' : String(Boolean(inStock)),
      ].join('|'),
    [limit, search, categoryId, minPrice, maxPrice, inStock]
  );

  const controllerRef = useRef(null);
  const lastSignatureRef = useRef(signature);

  // Reset when filters change
  useEffect(() => {
    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      setItems([]);
      setItemsByPage({});
      // Removed setPage(1) to avoid forcing page resets on filter changes
      setHasMore(true);
      setError(null);
    }
  }, [signature]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const fetchLatest = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setRefreshing(false);
      setError(null);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', String(search));
      if (categoryId != null && categoryId !== '') params.set('categoryId', String(categoryId));
      if (minPrice != null && minPrice !== '') params.set('minPrice', String(minPrice));
      if (maxPrice != null && maxPrice !== '') params.set('maxPrice', String(maxPrice));
      if (typeof inStock !== 'undefined' && inStock !== null) params.set('inStock', String(Boolean(inStock)));

      const attempts = [
        `/api/products?${params.toString()}`,
        `${base}/api/products?${params.toString()}`,
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          console.log(`[useFetchBrowseProducts] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          console.log('[useFetchBrowseProducts] Response:', res.status, res.statusText);
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          console.log('[useFetchBrowseProducts] Raw:', data);

          const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          const normalized = arr.map(normalizeItem);

          setItems((prev) => dedupeById(page === 1 ? normalized : [...prev, ...normalized]));
          setItemsByPage((prev) => ({ ...prev, [page]: normalized }));
          setMeta(data?.meta || null);

          const nextHasMore =
            typeof data?.meta?.hasMore !== 'undefined' ? Boolean(data.meta.hasMore) : arr.length === Number(limit);
          setHasMore(nextHasMore);

          if (page === 1) setLoading(false);
          else setLoadingMore(false);
          setRefreshing(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchBrowseProducts] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            if (page === 1) setLoading(false);
            else setLoadingMore(false);
            setRefreshing(false);
          }
        }
      }
    };

    fetchLatest();

    return () => {
      controller.abort();
      setRefreshing(false);
    };
  }, [page, limit, search, categoryId, minPrice, maxPrice, inStock, enabled]);

  const loadNextPage = () => {
    if (loading || loadingMore || !hasMore) return;
    setPage((p) => Number(p) + 1);
  };

  const reset = () => {
    setItems([]);
    setItemsByPage({});
    setPage(1);
    setHasMore(true);
    setError(null);
  };

  return { items, page, pageItems: itemsByPage[page] || [], itemsByPage, hasMore, loading, loadingMore, refreshing, error, meta, loadNextPage, setPage, reset };
}

function normalizeItem(p) {
  return {
    id: p.id,
    image_url: typeof p.image_url === 'string' ? p.image_url.replace(/`/g, '').trim() : '',
    name: p.name || '',
    description: p.description || '',
    price: typeof p.price === 'string' ? Number(p.price) : p.price,
    stock: p.stock,
    category_id: p.category_id,
    average_rating: p.average_rating !== undefined ? p.average_rating : 0,
    review_count: p.review_count !== undefined ? p.review_count : 0,
  };
}

function dedupeById(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = item?.id ?? item?.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
