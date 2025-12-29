import { useState, useEffect, useCallback } from 'react';
import authStorage from '../../use_auth/authStorage.js';

export default function useFetchAllReviews({
  page = 1,
  limit = 20,
  search = '',
  rating = '',
  product_id = '',
  startDate = '',
  endDate = '',
  sortBy = 'created_at',
  sortOrder = 'desc',
} = {}) {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null;
      const headers = {
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (search) queryParams.append('search', search);
      if (rating) queryParams.append('rating', rating);
      if (product_id) queryParams.append('product_id', product_id);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);

      const queryString = queryParams.toString();
      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000';
      
      const attempts = [
        `/api/reviews/admin/all?${queryString}`,
        `${base}/api/reviews/admin/all?${queryString}`,
      ];

      let lastErr;
      let success = false;

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i];
        try {
          const res = await fetch(url, {
            headers,
            signal: controller.signal,
          });
          if (!res.ok) {
            if (i === attempts.length - 1) {
               // Try to parse error message
               let msg = `HTTP ${res.status} ${res.statusText}`;
               try {
                 const jsonErr = await res.json();
                 if (jsonErr.message) msg = jsonErr.message;
               } catch (e) {}
               throw new Error(msg);
            }
            continue;
          }
          const json = await res.json();
          setReviews(json.reviews || []);
          setMeta(json.meta || {});
          setStats(json.stats || null);
          lastErr = null;
          success = true;
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!success && lastErr) throw lastErr;

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Fetch reviews error:", err);
        setError(err.message || 'Failed to fetch reviews');
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [page, limit, search, rating, product_id, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, meta, stats, loading, error, refetch: fetchReviews };
}
