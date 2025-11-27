import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useCreatePaymentIntent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createPaymentIntent = useCallback(async ({ orderId }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: Number(orderId) })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setLoading(false)
      return data
    } catch (e) {
      setError(e?.message || 'Failed to create payment intent')
      setLoading(false)
      throw e
    }
  }, [])

  return { createPaymentIntent, loading, error }
}

