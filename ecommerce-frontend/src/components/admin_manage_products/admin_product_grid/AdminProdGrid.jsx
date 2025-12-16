import React from 'react'
import './AdminProdGrid.css'
import AdminProdCard from './admin_prod_card/AdminProdCard.jsx'

export default function AdminProdGrid({ products = [], loading = false, onEdit }) {
  const ready = !loading

  if (!loading && (!products || products.length === 0)) {
    return (
      <section className="admin__admin_prod_grid_grid" data-ready={String(ready)}>
        <div className="admin__admin_prod_grid_empty">No products in grid</div>
      </section>
    )
  }

  const items = loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk-${i}` })) : products

  return (
    <section className="admin__admin_prod_grid_grid" data-ready={String(ready)}>
      <ul className="admin__admin_prod_grid_list" aria-busy={loading}>
        {items.map((p, i) => (
          <li key={p.id || i} className="admin__admin_prod_grid_item" style={{ '--i': i }}>
            {loading ? (
              <article className="admin__admin_prod_card_card admin__admin_prod_card_card--skeleton">
                <div className="admin__admin_prod_card_media">
                  <div className="admin__admin_prod_card_img_skeleton skeleton-block" aria-hidden="true" />
                </div>
                <div className="admin__admin_prod_card_body">
                  <div className="admin__admin_prod_card_name_skeleton skeleton-block" aria-hidden="true" />
                  <div className="admin__admin_prod_card_desc_skeleton skeleton-block" aria-hidden="true" />
                  <div className="admin__admin_prod_card_price_skeleton skeleton-block" aria-hidden="true" />
                </div>
              </article>
            ) : (
              <AdminProdCard product={p} onEdit={onEdit} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

