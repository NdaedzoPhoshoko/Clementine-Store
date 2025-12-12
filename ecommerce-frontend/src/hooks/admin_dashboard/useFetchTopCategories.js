import { useEffect, useRef, useState } from 'react';
import apiFetch from '../../utils/apiFetch.js';

export default function useFetchTopCategories(options = {}) {
  const {
    enabled = true,
    period = 'all_time',
    startDate,
    endDate,
    paidOnly = true,
    page = 1,
    limit = 12,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [trendyProduct, setTrendyProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (period) params.set('period', period);
        if (typeof paidOnly !== 'undefined') params.set('paidOnly', paidOnly ? 'true' : 'false');
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        params.set('page', String(page));
        params.set('limit', String(limit));
        const res = await apiFetch(`/api/categories/sales?${params.toString()}`, { headers: { accept: 'application/json' }, signal: controller.signal });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = payload?.message || `HTTP ${res.status}`;
          throw new Error(message);
        }
        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setMeta(payload?.meta || null);
        const tp = payload?.trendy_product || null;
        if (tp && typeof tp === 'object') {
          const cleaned = {
            product_id: tp.product_id,
            product_name: tp.product_name,
            product_review_count: tp.product_review_count,
            product_description: tp.product_description,
            sustainability_notes: tp.sustainability_notes || null,
            product_image: typeof tp.product_image === 'string' ? tp.product_image.replace(/`/g, '').trim() : tp.product_image || null,
          };
          setTrendyProduct(cleaned);
        } else {
          setTrendyProduct(null);
        }
        setLoading(false);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e);
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [enabled, period, startDate, endDate, paidOnly, page, limit, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { items, meta, trendyProduct, loading, error, refresh };
}
