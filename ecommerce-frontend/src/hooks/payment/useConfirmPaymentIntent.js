import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useConfirmPaymentIntent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const confirmPaymentIntent = useCallback(async ({ orderId, paymentIntentId }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/payments/confirm-intent', {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: Number(orderId), payment_intent_id: String(paymentIntentId) })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setLoading(false)
      return data
    } catch (e) {
      setError(e?.message || 'Failed to confirm payment')
      setLoading(false)
      throw e
    }
  }, [])

  return { confirmPaymentIntent, loading, error }
}

