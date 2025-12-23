import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiFetch from '../../../utils/apiFetch.js';

/**
 * Hook to fetch inventory logs with filtering and pagination.
 *
 * @param {Object} options
 * @param {number} [options.initialPage=1]
 * @param {number} [options.limit=20]
 * @param {string|number} [options.productId] - Filter by product ID
 * @param {string} [options.changeType] - Filter by change type (SALE, RESTOCK, etc.)
 * @param {string} [options.source] - Filter by source
 * @param {string} [options.size] - Filter by size
 * @param {string} [options.colorHex] - Filter by color hex
 * @param {number} [options.actorUserId] - Filter by actor user ID
 * @param {string} [options.startDate] - Start date (ISO string)
 * @param {string} [options.endDate] - End date (ISO string)
 * @param {boolean} [options.enabled=true] - Whether to fetch automatically
 */
export default function useFetchInventoryLogs({
  initialPage = 1,
  limit = 20,
  productId,
  changeType,
  source,
  size,
  colorHex,
  actorUserId,
  startDate,
  endDate,
  enabled = true,
} = {}) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  // Sync page prop
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  // Construct signature to detect filter changes
  const signature = useMemo(() => {
    return [
      productId || '',
      changeType || '',
      source || '',
      size || '',
      colorHex || '',
      actorUserId || '',
      startDate || '',
      endDate || '',
      limit,
    ].join('|');
  }, [productId, changeType, source, size, colorHex, actorUserId, startDate, endDate, limit]);

  const lastSignatureRef = useRef(signature);

  // Reset page when filters change
  useEffect(() => {
    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      setPage(1);
    }
  }, [signature]);

  const fetchLogs = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (productId) params.set('productId', String(productId));
      if (changeType) params.set('changeType', changeType);
      if (source) params.set('source', source);
      if (size) params.set('size', size);
      if (colorHex) params.set('colorHex', colorHex);
      if (actorUserId) params.set('actorUserId', String(actorUserId));
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await apiFetch(`/api/inventory-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setLogs(data.items || []);
      setMeta(data.meta || {});
    } catch (err) {
      console.error('Error fetching inventory logs:', err);
      setError(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    page,
    limit,
    productId,
    changeType,
    source,
    size,
    colorHex,
    actorUserId,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    meta,
    page,
    setPage,
    refresh: fetchLogs,
  };
}
