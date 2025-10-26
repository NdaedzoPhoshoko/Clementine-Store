import { useEffect, useRef, useState } from 'react';

// Cache TTL aligned with other hooks
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cacheKey = (productId) => `product-details-cache:v1:id=${productId}`;

export default function useFetchProductDetails({ productId, enabled = true } = {}) {
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const lastProductIdRef = useRef(productId);

  // Reset when product ID changes
  useEffect(() => {
    if (productId !== lastProductIdRef.current) {
      lastProductIdRef.current = productId;
      setProduct(null);
      setCategory(null);
      setImages([]);
      setReviews([]);
      setReviewStats({ averageRating: 0, reviewCount: 0 });
      setError(null);
    }
  }, [productId]);

  useEffect(() => {
    if (!enabled || !productId) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const KEY = cacheKey(productId);

    let usedCache = false;
    let cacheIsStale = true;

    // Try cache first for this product ID
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          const age = Date.now() - (cached.ts || 0);
          
          if (cached.product) {
            setProduct(cached.product);
            setCategory(cached.category || null);
            setImages(cached.images || []);
            setReviews(cached.reviews || []);
            setReviewStats(cached.reviewStats || { averageRating: 0, reviewCount: 0 });
            usedCache = true;
            cacheIsStale = age >= CACHE_TTL_MS;
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('[useFetchProductDetails] Cache read failed:', e);
    }

    const fetchLatest = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Update state with fetched data
        setProduct(data.product || null);
        setCategory(data.category || null);
        setImages(data.images || []);
        setReviews(data.reviews || []);
        setReviewStats(data.reviewStats || { averageRating: 0, reviewCount: 0 });
        
        // Cache the result
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(
              KEY,
              JSON.stringify({
                product: data.product,
                category: data.category,
                images: data.images,
                reviews: data.reviews,
                reviewStats: data.reviewStats,
                ts: Date.now(),
              })
            );
          }
        } catch (e) {
          console.warn('[useFetchProductDetails] Cache write failed:', e);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[useFetchProductDetails] Fetch error:', err);
          setError(err.message || 'Failed to fetch product details');
        }
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    };

    if (!usedCache || cacheIsStale) {
      fetchLatest();
    }

    return () => {
      controller.abort();
    };
  }, [productId, enabled]);

  return {
    product,
    category,
    images,
    reviews,
    reviewStats,
    loading,
    error,
    isLoading: loading,
    isError: !!error
  };
}