import { useEffect, useState } from 'react';

// Cache config (same TTL as new products)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (page, limit, search) =>
  `categories-with-images-cache:v1:p=${page}:l=${limit}:s=${encodeURIComponent(search || '')}`;

export default function useFetchCategoriesWithImages({ page = 1, limit = 16, search = '' } = {}) {
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const KEY = cacheKey(page, limit, search);
    let usedCache = false;
    let cacheIsStale = true;

    // Try cache first
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          if (Array.isArray(cached.categories)) {
            console.log('[useFetchCategoriesWithImages] Using cached categories. Age(ms):', age);
            setCategories(cached.categories);
            setMeta(cached.meta || null);
            setLoading(false);
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchCategoriesWithImages] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      if (!usedCache) setLoading(true);
      setError(null);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', String(search));

      const attempts = [
        `/api/categories/with-images?${params.toString()}`,
        `${base}/api/categories/with-images?${params.toString()}`,
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          console.log(`[useFetchCategoriesWithImages] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          console.log('[useFetchCategoriesWithImages] Response:', res.status, res.statusText);
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          console.log('[useFetchCategoriesWithImages] Raw:', data);

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

          console.log('[useFetchCategoriesWithImages] Normalized:', normalized);
          setCategories(normalized);
          setMeta(data?.meta || null);

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

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchCategoriesWithImages] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            if (!usedCache) setLoading(false);
          }
        }
      }
    };

    fetchLatest();

    return () => controller.abort();
  }, [page, limit, search]);

  return { categories, meta, loading, error };
}
