import { useCallback, useEffect, useRef, useState } from 'react'

const CACHE_KEY = 'home-features-cache:v1'
const CACHE_TTL_MS = 5 * 60 * 1000

const cleanImage = (u) => (typeof u === 'string' ? u.replace(/`/g, '').trim() : '')

export default function useHomeFeatures({ enabled = true } = {}) {
  const [data, setData] = useState({
    trendy_product: null,
    new_arrival: null,
    featured_collection: null,
    top_rated: null,
    low_stock_alert: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    controllerRef.current?.abort()
    controllerRef.current = controller

    let usedCache = false
    let cacheIsStale = true

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const cached = JSON.parse(raw)
          const age = Date.now() - (cached.ts || 0)
          if (cached && typeof cached === 'object') {
            setData({
              trendy_product: cached.trendy_product || null,
              new_arrival: cached.new_arrival || null,
              featured_collection: cached.featured_collection || null,
              top_rated: cached.top_rated || null,
              low_stock_alert: cached.low_stock_alert || null,
            })
            setLoading(false)
            usedCache = true
            cacheIsStale = age >= CACHE_TTL_MS
          }
        }
      }
    } catch (_) {}

    const fetchLatest = async () => {
      if (!usedCache) setLoading(true)
      setError(null)
      const base = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000'
      const attempts = ['/api/home-features', `${base}/api/home-features`]

      for (let i = 0; i < attempts.length; i++) {
        const url = attempts[i]
        try {
          const res = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const ct = res.headers.get('content-type') || ''
          if (!ct.includes('application/json')) throw new Error(`Unexpected content-type: ${ct}`)
          const payload = await res.json()

          const normProduct = (p) => {
            if (!p || typeof p !== 'object') return null
            const pid = p.product_id != null ? Number(p.product_id) : null
            return { product_id: pid, name: typeof p.name === 'string' ? p.name : String(p.name || ''), image_url: cleanImage(p.image_url) }
          }

          const normFeatured = (fc) => {
            if (!fc || typeof fc !== 'object') return null
            const cid = fc.category_id != null ? Number(fc.category_id) : null
            return {
              category_id: cid,
              category_name: typeof fc.category_name === 'string' ? fc.category_name : String(fc.category_name || ''),
              top_product: normProduct(fc.top_product),
            }
          }

          const next = {
            trendy_product: normProduct(payload?.trendy_product),
            new_arrival: normProduct(payload?.new_arrival),
            featured_collection: normFeatured(payload?.featured_collection),
            top_rated: normProduct(payload?.top_rated),
            low_stock_alert: normProduct(payload?.low_stock_alert),
          }

          setData(next)
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...next }))
            }
          } catch (_) {}
          setLoading(false)
          return
        } catch (err) {
          if (controller.signal.aborted) return
          if (i === attempts.length - 1) {
            setError(err)
            if (!usedCache) setLoading(false)
          }
        }
      }
    }

    if (!usedCache || cacheIsStale) {
      fetchLatest()
    }

    return () => controller.abort()
  }, [enabled, refreshKey])

  const refresh = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(CACHE_KEY)
      }
    } catch (_) {}
    setRefreshKey((k) => k + 1)
  }, [])

  const abort = useCallback(() => {
    controllerRef.current?.abort?.()
  }, [])

  return { data, loading, error, refresh, abort }
}

