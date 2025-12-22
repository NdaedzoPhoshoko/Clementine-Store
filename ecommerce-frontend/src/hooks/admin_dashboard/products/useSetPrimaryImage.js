import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useSetPrimaryImage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const setPrimary = useCallback(async (productId, url) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      const idNum = Number(productId)
      if (!Number.isFinite(idNum) || idNum <= 0) throw new Error('Invalid product id')
      if (!url) throw new Error('Missing image url')

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/products/${idNum}`,
        `${base}/api/products/${idNum}`,
      ]
      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
      if (!token) throw new Error('require signin')
      let lastErr
      for (let i = 0; i < attempts.length; i++) {
        const target = attempts[i]
        try {
          const res = await fetch(target, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ image_url: url }),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const ct = res.headers.get('content-type') || ''
          if (!ct.includes('application/json')) throw new Error('Unexpected content-type')
          const json = await res.json()
          setData(json)
          setPending(false)
          return json
        } catch (e) {
          lastErr = e
          if (i === attempts.length - 1) throw e
        }
      }
      if (lastErr) throw lastErr
    } catch (e) {
      setError(e)
      setPending(false)
      return null
    }
  }, [])

  return { setPrimary, pending, error, data }
}
