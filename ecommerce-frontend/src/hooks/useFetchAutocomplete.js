import { useEffect, useMemo, useState } from 'react';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (q, limit) => `autocomplete-cache:v1:q=${encodeURIComponent(q || '')}:l=${limit ?? 'na'}`;

export default function useFetchAutocomplete({ q = '', limit = 10, enabled = true } = {}) {
  const [bucket, setBucket] = useState([]);
  const [names, setNames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const trimmedQ = useMemo(() => String(q || '').trim(), [q]);

  useEffect(() => {
    const controller = new AbortController();
    const KEY = cacheKey(trimmedQ, limit);

    // If disabled or no query, reset state and skip fetching
    if (!enabled || !trimmedQ) {
      setBucket([]);
      setNames([]);
      setCategories([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    let usedCache = false;
    let cacheIsStale = true;

    // Try cache first
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          const cachedBucketIsArray = Array.isArray(cached.bucket);
          const cachedNamesIsArray = Array.isArray(cached.names);
          const cachedCategoriesIsArray = Array.isArray(cached.categories);
          if (cachedBucketIsArray && cachedNamesIsArray && cachedCategoriesIsArray) {
            setBucket(cached.bucket);
            setNames(cached.names);
            setCategories(cached.categories);
            setTotal(typeof cached.total === 'number' ? cached.total : Number(cached.total || 0));
            setLoading(false);
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchAutocomplete] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      if (!usedCache) setLoading(true);
      setError(null);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const params = new URLSearchParams({ q: trimmedQ });
      if (limit != null) params.set('limit', String(limit));

      const attempts = [
        `/api/products/autocomplete?${params.toString()}`,      // Vite proxy
        `${base}/api/products/autocomplete?${params.toString()}` // Absolute fallback
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          const res = await fetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();

          const rawNames = Array.isArray(data?.names) ? data.names : [];
          const rawCategories = Array.isArray(data?.categories) ? data.categories : [];
          const normalizedNames = rawNames.map(s => (typeof s === 'string' ? s.replace(/`/g, '').trim() : '')).filter(Boolean);
          const normalizedCategories = rawCategories.map(s => (typeof s === 'string' ? s.replace(/`/g, '').trim() : '')).filter(Boolean);

          // Merge and dedupe
          const merged = Array.from(new Set([...normalizedNames, ...normalizedCategories]));

          setBucket(merged);
          setNames(normalizedNames);
          setCategories(normalizedCategories);
          setTotal(typeof data?.total === 'number' ? data.total : Number(data?.total || 0));

          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(
                KEY,
                JSON.stringify({
                  ts: Date.now(),
                  bucket: merged,
                  names: normalizedNames,
                  categories: normalizedCategories,
                  total: typeof data?.total === 'number' ? data.total : Number(data?.total || 0)
                })
              );
            }
          } catch (e) {
            console.warn('[useFetchAutocomplete] Cache write failed:', e);
          }

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchAutocomplete] Attempt failed:', err);
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
  }, [trimmedQ, limit, enabled]);

  return { bucket, names, categories, total, loading, error };
}