import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useUpdateProduct() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const update = useCallback(async (productId, payload) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      const idNum = Number(productId)
      if (!Number.isFinite(idNum) || idNum <= 0) {
        throw new Error('Invalid product id')
      }

      const body = {}
      if (payload && typeof payload === 'object') {
        if (Object.prototype.hasOwnProperty.call(payload, 'name')) body.name = payload.name != null ? String(payload.name) : null
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) body.description = payload.description != null ? String(payload.description) : null
        if (Object.prototype.hasOwnProperty.call(payload, 'price')) {
          const n = payload.price
          const num = typeof n === 'string' ? parseFloat(n) : Number(n)
          body.price = Number.isFinite(num) ? num : undefined
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'image_url')) body.image_url = payload.image_url != null ? String(payload.image_url) : null
        if (Object.prototype.hasOwnProperty.call(payload, 'stock')) {
          const s = payload.stock
          const num = typeof s === 'string' ? parseInt(s, 10) : Number(s)
          body.stock = Number.isFinite(num) ? num : undefined
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'category_id')) {
          const c = payload.category_id
          if (c === null) body.category_id = null
          else {
            const num = typeof c === 'string' ? parseInt(c, 10) : Number(c)
            body.category_id = Number.isFinite(num) ? num : null
          }
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'details')) body.details = payload.details === null ? null : payload.details
        if (Object.prototype.hasOwnProperty.call(payload, 'dimensions')) body.dimensions = payload.dimensions === null ? null : payload.dimensions
        if (Object.prototype.hasOwnProperty.call(payload, 'care_notes')) body.care_notes = payload.care_notes === null ? null : payload.care_notes
        if (Object.prototype.hasOwnProperty.call(payload, 'sustainability_notes')) body.sustainability_notes = payload.sustainability_notes === null ? null : payload.sustainability_notes
        if (Object.prototype.hasOwnProperty.call(payload, 'color_variants')) body.color_variants = payload.color_variants === null ? null : payload.color_variants
      }

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/products/${idNum}`,
        `${base}/api/products/${idNum}`,
      ]
      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
      if (!token) throw new Error('require signin')
      let lastErr
      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i]
        try {
          const res = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
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
          if (res.status === 204 || !ct || !ct.includes('application/json')) {
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
          if (i === attempts.length - 1) {
            throw e
          }
        }
      }
      if (lastErr) throw lastErr
    } catch (e) {
      setError(e)
      setPending(false)
      throw e
    }
  }, [])

  return { update, pending, error, data }
}
