import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useDeleteAllProductImages() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const removeAll = useCallback(async (productId) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      const pid = Number(productId)
      if (!Number.isFinite(pid) || pid <= 0) throw new Error('Invalid product id')

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/products/${pid}/images`,
        `${base}/api/products/${pid}/images`,
      ]
      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
      if (!token) throw new Error('require signin')
      let lastErr
      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i]
        try {
          const res = await fetch(url, {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })
          if (!res.ok) {
            const ctErr = res.headers.get('content-type') || ''
            let serverMsg = `HTTP ${res.status}`
            try {
              if (ctErr.includes('application/json')) {
                const errJson = await res.json()
                serverMsg = errJson?.message || serverMsg
              } else {
                const errText = await res.text()
                serverMsg = errText || serverMsg
              }
            } catch (_) {}
            const err = new Error(serverMsg)
            err.status = res.status
            setError(err)
            setPending(false)
            throw err
          }
          const ct = res.headers.get('content-type') || ''
          if (!ct || !ct.includes('application/json')) {
            const result = { ok: true, status: res.status }
            setData(result)
            setPending(false)
            return result
          } else {
            const json = await res.json()
            setData(json)
            setPending(false)
            return json
          }
        } catch (e) {
          lastErr = e
          if (i === attempts.length - 1) throw e
        }
      }
      if (lastErr) throw lastErr
    } catch (e) {
      setError(e)
      setPending(false)
      throw e
    }
  }, [])

  return { removeAll, pending, error, data }
}
