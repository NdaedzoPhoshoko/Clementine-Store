import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useLatestOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLatestOrder = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/orders/my?limit=1&page=1', { headers: { accept: 'application/json' } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      const list = Array.isArray(data?.items) ? data.items : []
      const latest = list[0] || null
      setLoading(false)
      return latest
    } catch (e) {
      setError(e?.message || 'Failed to fetch latest order')
      setLoading(false)
      throw e
    }
  }, [])

  return { fetchLatestOrder, loading, error }
}

