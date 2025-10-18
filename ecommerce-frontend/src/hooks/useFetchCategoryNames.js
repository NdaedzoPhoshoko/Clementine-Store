import { useEffect, useState } from 'react';

// Cache config (same TTL as other hooks)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (page, limit, search) =>
  `category-names-cache:v1:p=${page}:l=${limit ?? 'na'}:s=${encodeURIComponent(search || '')}`;

export default function useFetchCategoryNames({ page = 1, limit, search = '' } = {}) {
  const [names, setNames] = useState([]);
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
          if (Array.isArray(cached.names) && Array.isArray(cached.categories)) {
            console.log('[useFetchCategoryNames] Using cached category names. Age(ms):', age);
            setNames(cached.names);
            setCategories(cached.categories);
            setMeta(cached.meta || null);
            setLoading(false);
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchCategoryNames] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      if (!usedCache) setLoading(true);
      setError(null);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const params = new URLSearchParams({ page: String(page) });
      if (limit != null) params.set('limit', String(limit));
      if (search) params.set('search', String(search));

      const attempts = [
        `/api/categories?${params.toString()}`,           // Vite proxy
        `${base}/api/categories?${params.toString()}`,    // Absolute fallback
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          console.log(`[useFetchCategoryNames] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          console.log('[useFetchCategoryNames] Response:', res.status, res.statusText);
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          console.log('[useFetchCategoryNames] Raw:', data);

          const arr = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
            ? data
            : [];

          const normalized = arr.map((c) => ({
            id: c.id,
            name: typeof c.name === 'string' ? c.name.replace(/`/g, '').trim() : '',
            description: c.description || '',
          }));

          const dedupedNames = Array.from(new Set(normalized.map((c) => c.name).filter(Boolean)));

          console.log('[useFetchCategoryNames] Names:', dedupedNames);
          setNames(dedupedNames);
          setCategories(normalized);
          setMeta(data?.meta || null);

          // Cache write
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(
                KEY,
                JSON.stringify({ ts: Date.now(), names: dedupedNames, categories: normalized, meta: data?.meta || null })
              );
            }
          } catch (e) {
            console.warn('[useFetchCategoryNames] Cache write failed:', e);
          }

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchCategoryNames] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            if (!usedCache) setLoading(false);
          }
        }
      }
    };

    if (!usedCache || cacheIsStale) {
      fetchLatest();
    }

    return () => controller.abort();
  }, [page, limit, search]);

  return { names, categories, meta, loading, error };
}