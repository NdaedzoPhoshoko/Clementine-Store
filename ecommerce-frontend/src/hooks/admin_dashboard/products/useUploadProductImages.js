import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useUploadProductImages() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const upload = useCallback(async (productId, files) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      const idNum = Number(productId)
      if (!Number.isFinite(idNum) || idNum <= 0) {
        throw new Error('Invalid product id')
      }
      const fl = Array.isArray(files) ? files : Array.from(files || [])
      if (!fl.length) {
        throw new Error('No files to upload')
      }
      const formData = new FormData()
      if (fl.length === 1) formData.append('image', fl[0])
      else fl.forEach((f) => formData.append('images', f))

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/products/${idNum}/images`,
        `${base}/api/products/${idNum}/images`,
      ]

      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
      if (!token) throw new Error('require signin')
      let lastErr
      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i]
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
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

  return { upload, pending, error, data }
}
