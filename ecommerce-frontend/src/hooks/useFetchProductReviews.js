import { useEffect, useRef, useState, useMemo } from 'react';
import apiFetch from '../utils/apiFetch.js';
import { authStorage } from './use_auth/authStorage.js';

// Cache TTL aligned with other hooks
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const cacheKey = (userId, productId) => `product-reviews-cache:v1:user=${userId ?? 'guest'}:id=${productId}`;

function normalizeReview(r) {
  if (!r || typeof r !== 'object') return null;
  return {
    id: r.id ?? r._id ?? null,
    user_id: r.user_id ?? r.userId ?? r.user?.id ?? null,
    user_name: (r.user_name ?? r.userName ?? r.user?.name ?? 'Anonymous')?.toString().trim(),
    rating: typeof r.rating === 'string' ? Number(r.rating) : (r.rating ?? 0),
    comment: (r.comment ?? r.text ?? r.content ?? r.review ?? '')?.toString(),
    created_at: r.created_at ?? r.createdAt ?? r.date ?? null,
    helpfulCount: r.helpfulCount ?? r.helpful ?? 0,
  };
}

export default function useFetchProductReviews({ productId, enabled = true } = {}) {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [haveOrdered, setHaveOrdered] = useState('require signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const lastProductIdRef = useRef(productId);
  const user = authStorage.getUser();
  const signature = useMemo(() => String(user?.id ?? 'guest'), [user?.id]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset when product ID changes
  useEffect(() => {
    if (productId !== lastProductIdRef.current) {
      lastProductIdRef.current = productId;
      setReviews([]);
      setReviewStats({ averageRating: 0, reviewCount: 0 });
      setHaveOrdered('require signin');
      setError(null);
    }
  }, [productId]);

  useEffect(() => {
    if (!enabled || !productId) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const KEY = cacheKey(signature, productId);

    let usedCache = false;
    let cacheIsStale = true;

    // Try cache first for this product's reviews
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          const arr = Array.isArray(cached.reviews) ? cached.reviews : [];
          const stats = cached.stats || cached.reviewStats || { averageRating: 0, reviewCount: 0 };
          const cachedHaveOrdered = cached.haveOrdered;
          if (arr.length > 0 || stats) {
            const normalized = arr.map(normalizeReview).filter(Boolean);
            setReviews(normalized);
            setReviewStats(stats);
            if (typeof cachedHaveOrdered === 'string') {
              setHaveOrdered(cachedHaveOrdered);
            }
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchProductReviews] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      setError(null);
      setLoading(!usedCache);

      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
      const attempts = [
        `/api/products/${productId}/reviews`,
        `${base}/api/products/${productId}/reviews`,
      ];

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          const res = await apiFetch(url, {
            headers: { accept: 'application/json' },
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            throw new Error(`Unexpected content-type: ${ct}`);
          }

          const data = await res.json();
          const arr = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
          const stats = data?.stats || data?.reviewStats || { averageRating: 0, reviewCount: 0 };
          const have = data?.haveOrdered;

          const normalized = arr.map(normalizeReview).filter(Boolean);
          setReviews(normalized);
          setReviewStats(stats);
          if (typeof have === 'string') {
            setHaveOrdered(have);
          } else {
            setHaveOrdered('require signin');
          }

          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(
                KEY,
                JSON.stringify({ ts: Date.now(), reviews: arr, stats, haveOrdered: have })
              );
            }
          } catch (e) {
            console.warn('[useFetchProductReviews] Cache write failed:', e);
          }

          // Debug log to verify haveOrdered and stats
          console.log('[useFetchProductReviews] fetched', {
            productId,
            haveOrdered: typeof have === 'string' ? have : 'require signin',
            count: normalized.length,
            stats,
          });

          setLoading(false);
          return; // success
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn('[useFetchProductReviews] Attempt failed:', err);
          if (i === attempts.length - 1) {
            setError(err);
            setLoading(false);
          }
        }
      }
    };

    if (!usedCache || cacheIsStale) {
      fetchLatest();
    } else {
      // Even with fresh cache, haveOrdered can depend on auth state; fetch to refresh it quietly.
      fetchLatest();
    }

    return () => {
      controller.abort();
    };
  }, [productId, enabled, signature, refreshKey]);

  useEffect(() => {
    const onAuthChanged = (e) => {
      const isAuthed = !!e?.detail?.isAuthed;
      if (!isAuthed) {
        setHaveOrdered('require signin');
        setRefreshKey((k) => k + 1);
      } else {
        setRefreshKey((k) => k + 1);
      }
    };
    try { window.addEventListener('auth:changed', onAuthChanged); } catch (_) {}
    return () => {
      try { window.removeEventListener('auth:changed', onAuthChanged); } catch (_) {}
    };
  }, []);

  return {
    reviews,
    reviewStats,
    haveOrdered,
    loading,
    error,
    isLoading: loading,
    isError: !!error,
  };
}
