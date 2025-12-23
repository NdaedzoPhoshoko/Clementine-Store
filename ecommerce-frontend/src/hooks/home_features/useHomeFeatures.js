import { useCallback, useEffect, useRef, useState } from 'react'

const cleanImage = (u) => (typeof u === 'string' ? u.replace(/`/g, '').trim() : '')

export default function useHomeFeatures({ enabled = true } = {}) {
  // Initialize with empty data; no localStorage reading (real-time only)
  const [data, setData] = useState({
    trendy_product: null,
    new_arrival: null,
    featured_collection: null,
    top_rated: null,
    low_stock_alert: null,
  })

  // Start as loading since we have no data initially
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

    const fetchLatest = async () => {
      // Check if we already have populated data
      const hasData = data.trendy_product || data.new_arrival || data.featured_collection || data.top_rated || data.low_stock_alert
      
      // Only show loading state if we have NO data.
      // This prevents the "placeholder state" (skeletons) from reappearing during a refresh.
      if (!hasData) setLoading(true)
      
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
          setLoading(false)
          return
        } catch (err) {
          if (controller.signal.aborted) return
          if (i === attempts.length - 1) {
            setError(err)
            // If we failed and had no data, we stop loading (error state).
            // If we had data, we keep showing it (silent failure).
            if (!hasData) setLoading(false)
          }
        }
      }
    }

    fetchLatest()

    return () => controller.abort()
  }, [enabled, refreshKey])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const abort = useCallback(() => {
    controllerRef.current?.abort?.()
  }, [])

  return { data, loading, error, refresh, abort }
}
