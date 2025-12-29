import React, { useEffect, useMemo, useState } from 'react'
import './Products.css'
import useManageProducts from '../../ManageProductsContext.jsx'
import useFetchBrowseProducts from '../../../../../hooks/useFetchBrowseProducts.js'
import AdminProdGrid from '../../../../../components/admin_manage_products/admin_product_grid/AdminProdGrid.jsx'
import PaginationBar from '../../../../../components/pagination/PaginationBar.jsx'
import { useNavigate } from 'react-router-dom'
import { createProductSlug } from '../../../../../utils/slugUtils.js'
import useDeleteProduct from '../../../../../hooks/useDeleteProduct.js'
import ConfirmModal from '../../../../../components/modals/confirm_modal/ConfirmModal.jsx'

export default function Products() {
  const { query, stock } = useManageProducts()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })
  const { deleteProduct, loading: deleting } = useDeleteProduct()

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

  const { page, setPage, pageItems, loading, loadingMore, meta, hasMore, refetch } = useFetchBrowseProducts({
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

  const handleEdit = (id) => {
    if (!id) return
    const found = displayProducts.find((p) => p.id === id)
    const slug = createProductSlug(found?.name || 'product', id)
    navigate(`/admin/product_management/products/edit/${slug}`)
  }
  const totalPages = meta?.pages || 1
  const hasPrev = typeof meta?.hasPrev !== 'undefined' ? !!meta?.hasPrev : page > 1
  const hasNext = typeof meta?.hasNext !== 'undefined' ? !!meta?.hasNext : !!hasMore
  const goToPage = (n) => {
    const target = Number(n)
    if (!Number.isFinite(target)) return
    if (target < 1 || target === page) return
    setPage(target)
  }

  const handleDeleteClick = (id) => {
    setDeleteModal({ open: true, id })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return
    const success = await deleteProduct(deleteModal.id)
    if (success) {
      setDeleteModal({ open: false, id: null })
      refetch()
    }
  }

  return (
    <div className="admin__products_products">
      <AdminProdGrid products={displayProducts} loading={isActuallyLoading} onEdit={handleEdit} onDelete={handleDeleteClick} />
      <PaginationBar
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={goToPage}
      />
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        isLoading={deleting}
      />
    </div>
  )
}

