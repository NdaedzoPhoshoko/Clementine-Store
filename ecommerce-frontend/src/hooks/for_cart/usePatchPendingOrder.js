import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

const normalizeString = (v) => (typeof v === 'string' ? v.trim() : '')

export default function usePatchPendingOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const patchPendingOrder = useCallback(async ({ shipping } = {}) => {
    setLoading(true)
    setError(null)

    const headers = { accept: 'application/json', 'Content-Type': 'application/json' }

    const body = {
      shipping: shipping
        ? {
            name: normalizeString(shipping.name),
            address: normalizeString(shipping.address),
            city: normalizeString(shipping.city),
            province: normalizeString(shipping.province),
            postal_code: normalizeString(shipping.postal_code),
            phone_number: normalizeString(shipping.phone_number),
          }
        : undefined,
    }

    try {
      const res = await apiFetch('/api/orders', { method: 'PATCH', headers, body: JSON.stringify(body) })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = payload?.message || payload?.error || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setLoading(false)
      return payload
    } catch (e) {
      setError(e?.message || 'Failed to patch pending order')
      setLoading(false)
      throw e
    }
  }, [])

  return { patchPendingOrder, loading, error }
}

