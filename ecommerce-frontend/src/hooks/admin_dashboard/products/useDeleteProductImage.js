import { useState, useCallback } from 'react'
import authStorage from '../../use_auth/authStorage.js'

export default function useDeleteProductImage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const remove = useCallback(async (productId, imageIdOrUrl) => {
    setPending(true)
    setError(null)
    setData(null)
    try {
      const pid = Number(productId)
      if (!Number.isFinite(pid) || pid <= 0) throw new Error('Invalid product id')

      let iid = Number(imageIdOrUrl)
      if (!Number.isFinite(iid) || iid <= 0) {
        const urlRef = typeof imageIdOrUrl === 'string' ? imageIdOrUrl.trim() : ''
        if (!urlRef) throw new Error('Invalid image reference')
        const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
        const attemptsInfo = [
          `/api/products/${pid}`,
          `${base}/api/products/${pid}`,
        ]
        let resolvedId = null
        let lastErrInfo
        for (let k = 0; k < attemptsInfo.length; k++) {
          const infoUrl = attemptsInfo[k]
          try {
            const infoRes = await fetch(infoUrl, { headers: { Accept: 'application/json' } })
            if (!infoRes.ok) throw new Error(`HTTP ${infoRes.status}`)
            const ct = infoRes.headers.get('content-type') || ''
            const infoJson = ct.includes('application/json') ? await infoRes.json() : null
            const entries = Array.isArray(infoJson?.image_entries) ? infoJson.image_entries : []
            const found = entries.find((e) => e?.image_url === urlRef)
            if (found?.id) {
              resolvedId = Number(found.id)
              break
            }
          } catch (e) {
            lastErrInfo = e
            if (k === attemptsInfo.length - 1) {
              throw e
            }
          }
        }
        if (!resolvedId || !Number.isFinite(resolvedId) || resolvedId <= 0) {
          throw new Error('Image id not found for provided url')
        }
        iid = resolvedId
      }

      const base = typeof import.meta?.env?.VITE_API_BASE_URL !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:5000'
      const attempts = [
        `/api/products/${pid}/images/${iid}`,
        `${base}/api/products/${pid}/images/${iid}`,
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

  return { remove, pending, error, data }
}
