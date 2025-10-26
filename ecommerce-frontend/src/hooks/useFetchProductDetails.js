import { useEffect, useRef, useState } from 'react';

// Cache TTL aligned with other hooks
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cacheKey = (productId) => `product-details-cache:v1:id=${productId}`;

// Normalize product fields from API (price -> number, image_url cleaned)
const normalizeProduct = (p) => {
  if (!p) return null;
  const imageUrl = typeof p.image_url === 'string' ? p.image_url.trim().replace(/^`|`$/g, '') : p.image_url;
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
  return { ...p, image_url: imageUrl, price: priceNum };
};

export default function useFetchProductDetails({ productId, enabled = true } = {}) {
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [details, setDetails] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [sizeChart, setSizeChart] = useState(null);
  const [careNotes, setCareNotes] = useState([]);
  const [sustainabilityNotes, setSustainabilityNotes] = useState(null);
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
      setDetails(null);
      setDimensions(null);
      setSizeChart(null);
      setCareNotes([]);
      setSustainabilityNotes(null);
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
            const prodFromCache = cached.product ? {
              ...cached.product,
              image_url: typeof cached.product.image_url === 'string' ? cached.product.image_url.trim().replace(/^`|`$/g, '') : cached.product.image_url,
              price: typeof cached.product.price === 'string' ? parseFloat(cached.product.price) : cached.product.price,
            } : null;
            const imgsFromCache = Array.isArray(cached.images)
              ? cached.images.map(u => typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : (u?.image_url?.trim?.().replace(/^`|`$/g, ''))).filter(Boolean)
              : [];
            setProduct(prodFromCache);
            setCategory(cached.category || null);
            setImages(imgsFromCache);
            setReviews(cached.reviews || []);
            setReviewStats(cached.reviewStats || { averageRating: 0, reviewCount: 0 });
            setDetails(cached.details ?? cached.product?.details ?? null);
            setDimensions(cached.dimensions ?? cached.product?.dimensions ?? null);
            setSizeChart(cached.sizeChart ?? cached.product?.dimensions?.size_chart ?? null);
            setCareNotes(cached.careNotes ?? cached.product?.care_notes ?? []);
            setSustainabilityNotes(cached.sustainabilityNotes ?? cached.product?.sustainability_notes ?? null);
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
        
        const productNorm = data.product ? {
          ...data.product,
          image_url: typeof data.product.image_url === 'string' ? data.product.image_url.trim().replace(/^`|`$/g, '') : data.product.image_url,
          price: typeof data.product.price === 'string' ? parseFloat(data.product.price) : data.product.price,
        } : null;
        const imagesNorm = Array.isArray(data.images)
          ? data.images.map(u => typeof u === 'string' ? u.trim().replace(/^`|`$/g, '') : (u?.image_url?.trim?.().replace(/^`|`$/g, ''))).filter(Boolean)
          : (productNorm?.image_url ? [productNorm.image_url] : []);
        
        // Update state with fetched data
        setProduct(productNorm || null);
        setCategory(data.category || null);
        setImages(imagesNorm);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setReviewStats(data.reviewStats || { averageRating: 0, reviewCount: 0 });
        setDetails(productNorm?.details || null);
        setDimensions(productNorm?.dimensions || null);
        setSizeChart(productNorm?.dimensions?.size_chart || null);
        setCareNotes(productNorm?.care_notes || []);
        setSustainabilityNotes(productNorm?.sustainability_notes || null);
        
        // Cache the result
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(
              KEY,
              JSON.stringify({
                product: productNorm,
                category: data.category,
                images: imagesNorm,
                reviews: Array.isArray(data.reviews) ? data.reviews : [],
                reviewStats: data.reviewStats,
                details: productNorm?.details || null,
                dimensions: productNorm?.dimensions || null,
                sizeChart: productNorm?.dimensions?.size_chart || null,
                careNotes: productNorm?.care_notes || [],
                sustainabilityNotes: productNorm?.sustainability_notes || null,
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
    details,
    dimensions,
    sizeChart,
    careNotes,
    sustainabilityNotes,
    loading,
    error,
    isLoading: loading,
    isError: !!error
  };
}