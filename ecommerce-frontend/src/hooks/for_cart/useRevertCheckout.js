import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useRevertCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const revertCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/cart/revert-checkout', { method: 'POST', headers: { accept: 'application/json' } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setLoading(false)
      return data
    } catch (e) {
      setError(e?.message || 'Failed to cancel checkout')
      setLoading(false)
      throw e
    }
  }, [])

  return { revertCheckout, loading, error }
}

