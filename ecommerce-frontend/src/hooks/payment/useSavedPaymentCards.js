import { useCallback, useState } from 'react'
import apiFetch from '../../utils/apiFetch.js'

export default function useSavedPaymentCards() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  const saveCard = useCallback(async ({
    brand,
    card_number,
    last4,
    exp_month,
    exp_year,
    exp,
    cardholder_name,
    external_token,
  }) => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        brand: typeof brand === 'string' ? brand : undefined,
        card_number: typeof card_number === 'string' ? card_number : undefined,
        last4: typeof last4 === 'string' ? last4 : undefined,
        exp_month: Number.isFinite(exp_month) ? exp_month : undefined,
        exp_year: Number.isFinite(exp_year) ? exp_year : undefined,
        exp: typeof exp === 'string' ? exp : undefined,
        cardholder_name: typeof cardholder_name === 'string' ? cardholder_name : undefined,
        external_token: typeof external_token === 'string' ? external_token : undefined,
      }
      const res = await apiFetch('/api/cards', {
        method: 'POST',
        headers: { accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      const card = data?.card || null
      if (card && typeof card === 'object') {
        setItems((prev) => {
          const idx = prev.findIndex((c) => Number(c.id) === Number(card.id))
          if (idx >= 0) {
            const next = prev.slice()
            next[idx] = card
            return next
          }
          return [...prev, card]
        })
      }
      setLoading(false)
      return card
    } catch (e) {
      setError(e?.message || 'Failed to save payment card')
      setLoading(false)
      throw e
    }
  }, [])

  const removeCard = useCallback(async ({ id }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/cards/${Number(id)}`, {
        method: 'DELETE',
        headers: { accept: 'application/json' }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setItems((prev) => prev.filter((c) => Number(c.id) !== Number(id)))
      setLoading(false)
      return true
    } catch (e) {
      setError(e?.message || 'Failed to remove payment card')
      setLoading(false)
      throw e
    }
  }, [])

  return { saveCard, removeCard, items, loading, error }
}

