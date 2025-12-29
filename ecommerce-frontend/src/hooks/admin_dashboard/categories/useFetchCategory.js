import { useState, useEffect } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useFetchCategory(id) {
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const fetchCategory = async () => {
      try {
        const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
        const headers = {
          Accept: 'application/json',
        }
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
        const attempts = [
          `/api/categories/${id}`,
          `${base}/api/categories/${id}`,
        ]

        let lastErr
        for (let i = 0; i < attempts.length; i++) {
          const url = attempts[i]
          try {
            const res = await fetch(url, {
              headers,
              signal: controller.signal,
            })
            if (!res.ok) {
               if (i === attempts.length - 1) {
                 throw new Error(`HTTP ${res.status} ${res.statusText}`)
               }
               continue
            }
            const json = await res.json()
            setCategory(json)
            lastErr = null
            break
          } catch (err) {
            lastErr = err
          }
        }
        if (lastErr) throw lastErr

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
          setError(err.message || 'Failed to fetch category')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()

    return () => controller.abort()
  }, [id])

  return { category, loading, error }
}
