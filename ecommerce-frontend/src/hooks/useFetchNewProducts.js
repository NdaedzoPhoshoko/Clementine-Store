import { useEffect, useState } from 'react';

export default function useFetchNewProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLatest = async () => {
      setLoading(true);
      setError(null);
      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const timestamp = Date.now();
      const attempts = [
        `/api/products/new?_t=${timestamp}`, // Vite proxy
        `${base}/api/products/new?_t=${timestamp}`, // Absolute fallback
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          console.log(`[useFetchNewProducts] Attempt ${i + 1}:`, url);
          const res = await fetch(url, {
            headers: { 
              accept: 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
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
            average_rating: typeof p.average_rating === 'number' ? p.average_rating : 0,
            review_count: typeof p.review_count === 'number' ? p.review_count : 0,
          }));

          console.log('[useFetchNewProducts] Normalized:', normalized);
          setProducts(normalized);
          setLoading(false);
          return; // success, stop attempts
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchNewProducts] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            setLoading(false);
          }
        }
      }
    };

    fetchLatest();
    return () => controller.abort();
  }, []);

  return { products, loading, error };
}