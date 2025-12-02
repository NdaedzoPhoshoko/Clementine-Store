import { useCallback, useRef, useState } from 'react';
import { apiFetch } from '../utils/apiFetch.js';

export default function usePostProductReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const postReview = useCallback(async ({ product_id, rating, comment }) => {
    if (!product_id) throw new Error('Missing product_id');
    const rate = Math.max(1, Math.min(5, Number(rating) || 0));
    if (!rate) throw new Error('Rating must be between 1 and 5');
    const text = (comment ?? '').toString().trim();
    if (!text) throw new Error('Comment cannot be empty');

    controllerRef.current?.abort?.();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, rating: rate, comment: text }),
        signal: controller.signal,
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error(`Unexpected content-type: ${ct}`);
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status} ${res.statusText}`);
      }
      const review = data?.review || null;
      const stats = data?.stats || null;
      return { review, stats };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const abort = useCallback(() => {
    controllerRef.current?.abort?.();
  }, []);

  return { postReview, loading, error, abort, isLoading: loading, isError: !!error };
}