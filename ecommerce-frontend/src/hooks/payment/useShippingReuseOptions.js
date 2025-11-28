import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useShippingReuseOptions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  const fetchReuseOptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/shipping-details/reuse', {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      const arr = Array.isArray(data?.items) ? data.items : []
      const normalized = arr.map((r) => ({
        city: typeof r.city === 'string' ? r.city : null,
        province: typeof r.province === 'string' ? r.province : null,
        postal_code: typeof r.postal_code === 'string' ? r.postal_code : null,
        address: typeof r.address === 'string' ? r.address : null,
        phone_number: typeof r.phone_number === 'string' ? r.phone_number : null,
      }))
      setItems(normalized)
      setLoading(false)
      return normalized
    } catch (e) {
      setError(e?.message || 'Failed to fetch shipping reuse options')
      setLoading(false)
      throw e
    }
  }, [])

  return { fetchReuseOptions, items, loading, error }
}
