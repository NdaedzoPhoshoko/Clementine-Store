import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useAddCategoriesBulk() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const add = useCallback(async (categories) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error("Provide a non-empty 'categories' array")
      }

      const token = typeof window !== 'undefined' ? (authStorage.getAccessToken() || authStorage.getToken()) : null
      if (!token) throw new Error('require signin')

      const body = { categories }
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/categories/add`,
        `${base}/api/categories/add`,
      ]
      
      let lastErr
      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i]
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers,
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
            throw new Error(serverMsg)
          }
          const json = await res.json()
          setData(json)
          return json
        } catch (err) {
          lastErr = err
          if (i === attempts.length - 1) throw err
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.message || String(err))
      throw err
    } finally {
      setPending(false)
    }
  }, [])

  return { add, pending, error, data }
}
