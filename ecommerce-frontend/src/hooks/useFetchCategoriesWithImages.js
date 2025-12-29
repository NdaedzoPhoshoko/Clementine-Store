import { useEffect, useState } from 'react';

// Cache disabled for immediate updates
// const CACHE_TTL_MS = 5 * 60 * 1000; 

export default function useFetchCategoriesWithImages({ page = 1, limit = 16, search = '' } = {}) {
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey(prev => prev + 1);

  // kept for backward compatibility, but caching is disabled
  const invalidateCache = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const prefix = 'categories-with-images-cache:';
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keys.push(k);
          }
        }
        keys.forEach((k) => localStorage.removeItem(k));
        // console.log(`[useFetchCategoriesWithImages] Invalidated ${keys.length} cache entries.`);
      }
    } catch (e) {
      console.warn('[useFetchCategoriesWithImages] Cache invalidation failed:', e);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    // Cache logic disabled
    // const KEY = cacheKey(page, limit, search);
    // let usedCache = false;

    const fetchLatest = async () => {
      setLoading(true);
      setError(null);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const params = new URLSearchParams({ 
        page: String(page), 
        limit: String(limit),
        _t: String(Date.now()) // Prevent browser caching
      });
      if (search) params.set('search', String(search));

      const attempts = [
        `/api/categories/with-images?${params.toString()}`,
        `${base}/api/categories/with-images?${params.toString()}`,
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          // console.log(`[useFetchCategoriesWithImages] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { 
              accept: 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            signal: controller.signal,
          });
          // console.log('[useFetchCategoriesWithImages] Response:', res.status, res.statusText);
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          // console.log('[useFetchCategoriesWithImages] Raw:', data);

          const arr = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
            ? data
            : [];

          const normalized = arr.map((c) => ({
            id: c.id,
            name: c.name || '',
            description: c.description || '',
            // Some backends accidentally return image wrapped in backticks/spaces — sanitize
            image: typeof c.image === 'string' ? c.image.replace(/`/g, '').trim() : '',
          }));

          // console.log('[useFetchCategoriesWithImages] Normalized:', normalized);
          setCategories(normalized);
          setMeta(data?.meta || null);

          // Cache write disabled
          /*
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(
                KEY,
                JSON.stringify({ ts: Date.now(), categories: normalized, meta: data?.meta || null })
              );
            }
          } catch (e) {
            console.warn('[useFetchCategoriesWithImages] Cache write failed:', e);
          }
          */

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchCategoriesWithImages] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            setLoading(false);
          }
        }
      }
    };

    fetchLatest();

    return () => controller.abort();
  }, [page, limit, search, refreshKey]);

  return { categories, meta, loading, error, refetch, invalidateCache };
}
