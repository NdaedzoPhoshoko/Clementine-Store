import React, { useEffect, useMemo, useState } from 'react'
import './Products.css'
import useManageProducts from '../../ManageProductsContext.jsx'
import useFetchBrowseProducts from '../../../../../hooks/useFetchBrowseProducts.js'
import AdminProdGrid from '../../../../../components/admin_manage_products/admin_product_grid/AdminProdGrid.jsx'
import PaginationBar from '../../../../../components/pagination/PaginationBar.jsx'

export default function Products() {
  const { query, stock } = useManageProducts()

  const getDefaultItemsPerPage = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    if (w >= 1280) return 20
    if (w >= 1024) return 16
    if (w >= 768) return 12
    return 8
  }
  const [itemsPerPage, setItemsPerPage] = useState(getDefaultItemsPerPage())
  useEffect(() => {
    const compute = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200
      let next = 12
      if (w >= 1280) next = 20
      else if (w >= 1024) next = 16
      else if (w >= 768) next = 12
      else next = 8
      setItemsPerPage(next)
    }
    compute()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', compute, { passive: true })
      return () => window.removeEventListener('resize', compute)
    }
  }, [])

  const inStock =
    stock === 'In Stock' ? true : stock === 'Out of Stock' ? false : undefined

  const { page, setPage, pageItems, loading, loadingMore, meta, hasMore } = useFetchBrowseProducts({
    initialPage: 1,
    limit: itemsPerPage,
    search: query,
    inStock,
    enabled: true,
  })

  const displayProducts = useMemo(() => {
    const arr = Array.isArray(pageItems) ? pageItems : []
    return arr.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image_url,
      rating: typeof p.average_rating === 'number' ? p.average_rating : 0,
      reviewCount: typeof p.review_count === 'number' ? p.review_count : 0,
    }))
  }, [pageItems])

  const isActuallyLoading = loading || loadingMore || !Array.isArray(pageItems)

  const handleEdit = (id) => {}
  const totalPages = meta?.pages || 1
  const hasPrev = typeof meta?.hasPrev !== 'undefined' ? !!meta?.hasPrev : page > 1
  const hasNext = typeof meta?.hasNext !== 'undefined' ? !!meta?.hasNext : !!hasMore
  const goToPage = (n) => {
    const target = Number(n)
    if (!Number.isFinite(target)) return
    if (target < 1 || target === page) return
    setPage(target)
  }

  return (
    <div className="admin__products_products">
      <AdminProdGrid products={displayProducts} loading={isActuallyLoading} onEdit={handleEdit} />
      <PaginationBar
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={goToPage}
      />
    </div>
  )
}

