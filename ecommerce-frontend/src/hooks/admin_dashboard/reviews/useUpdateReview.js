import { useState } from 'react';
import authStorage from '../../use_auth/authStorage.js';

export default function useUpdateReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateReview = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
        const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null;
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000';
        const attempts = [
            `/api/reviews/${id}`,
            `${base}/api/reviews/${id}`,
        ];

        let lastErr;
        let result;

        for (let i = 0; i < attempts.length; i++) {
            const url = attempts[i];
            try {
                const res = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(data),
                });
                
                if (!res.ok) {
                    if (i === attempts.length - 1) {
                         let msg = `HTTP ${res.status} ${res.statusText}`;
                         try {
                           const jsonErr = await res.json();
                           if (jsonErr.message) msg = jsonErr.message;
                         } catch (e) {}
                         throw new Error(msg);
                    }
                    continue;
                }
                result = await res.json();
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
            }
        }
        if (lastErr) throw lastErr;
        return result;
    } catch (err) {
        console.error("Update review error:", err);
        setError(err.message || 'Failed to update review');
        throw err;
    } finally {
        setLoading(false);
    }
  };

  return { updateReview, loading, error };
}
