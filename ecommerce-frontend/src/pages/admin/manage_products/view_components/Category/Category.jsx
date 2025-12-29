import React, { useEffect, useMemo, useState } from 'react'
import './Category.css'
import useManageProducts from '../../ManageProductsContext.jsx'
import useFetchCategoriesWithImages from '../../../../../hooks/useFetchCategoriesWithImages.js'
import CatList from '../../../../../components/admin_manage_products/admin_cat_list/CatList.jsx'
import PaginationBar from '../../../../../components/pagination/PaginationBar.jsx'
import { useNavigate } from 'react-router-dom'
import { createCategorySlug } from '../../../../../utils/slugUtils.js'

export default function Category() {
  const { query } = useManageProducts()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

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

  const { categories, meta, loading, error } = useFetchCategoriesWithImages({
    page,
    limit: itemsPerPage,
    search: query,
  })

  // Reset page when query changes
  useEffect(() => {
    setPage(1)
  }, [query])

  const displayCategories = useMemo(() => {
    const arr = Array.isArray(categories) ? categories : []
    return arr.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      product_count: c.product_count
    }))
  }, [categories])

  const handleEdit = (cat) => {
    if (!cat || !cat.id) return
    const slug = createCategorySlug(cat.name || 'category', cat.id)
    navigate(`/admin/product_management/categories/edit/${slug}`)
  }

  const totalPages = meta?.pages || 1
  const hasPrev = typeof meta?.hasPrev !== 'undefined' ? !!meta?.hasPrev : page > 1
  const hasNext = typeof meta?.hasNext !== 'undefined' ? !!meta?.hasNext : page < totalPages
  
  const goToPage = (n) => {
    const target = Number(n)
    if (!Number.isFinite(target)) return
    if (target < 1 || target === page) return
    setPage(target)
  }

  return (
    <div className="admin__cat_category_page">
      {error && <div className="admin__cat_error">{error.message || 'Error loading categories'}</div>}
      <CatList categories={displayCategories} loading={loading} onEdit={handleEdit} />
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
