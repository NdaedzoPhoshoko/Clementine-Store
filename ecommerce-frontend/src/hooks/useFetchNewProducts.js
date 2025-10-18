import { useEffect, useState } from 'react';

const CACHE_KEY = 'new-products-cache:v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function useFetchNewProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    // Try cache first
    let usedCache = false;
    let cacheIsStale = true;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          if (Array.isArray(cached.products)) {
            console.log('[useFetchNewProducts] Using cached products. Age(ms):', age);
            setProducts(cached.products);
            setLoading(false);
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchNewProducts] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      if (!usedCache) setLoading(true);
      setError(null);
      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const attempts = [
        '/api/products/new', // Vite proxy
        `${base}/api/products/new`, // Absolute fallback
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          console.log(`[useFetchNewProducts] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          console.log('[useFetchNewProducts] Response:', res.status, res.statusText);
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          console.log('[useFetchNewProducts] Raw:', data);

          const arr = Array.isArray(data)
            ? data
            : Array.isArray(data?.products)
            ? data.products
            : [];

          const normalized = arr.map((p) => ({
            id: p.id,
            image_url:
              typeof p.image_url === 'string' ? p.image_url.replace(/`/g, '').trim() : '',
            name: p.name || '',
            description: p.description || '',
            price: typeof p.price === 'string' ? Number(p.price) : p.price,
          }));

          console.log('[useFetchNewProducts] Normalized:', normalized);
          setProducts(normalized);
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), products: normalized }));
            }
          } catch (e) {
            console.warn('[useFetchNewProducts] Cache write failed:', e);
          }
          setLoading(false);
          return; // success, stop attempts
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchNewProducts] Attempt failed:', err);
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
  }, []);

  return { products, loading, error };
}