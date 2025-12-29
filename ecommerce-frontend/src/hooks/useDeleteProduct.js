import { useState, useCallback } from 'react';
import apiFetch from '../utils/apiFetch.js';

export default function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const deleteProduct = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiFetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      setSuccess(true);
      return true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteProduct, loading, error, success, reset: () => setSuccess(false) };
}
