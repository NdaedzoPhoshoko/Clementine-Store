import React from 'react'
import './CatList.css'
import CatListItem from './cat_list_item/CatListItem.jsx'

export default function CatList({ categories = [], loading = false, onEdit }) {
  const ready = !loading

  if (!loading && (!categories || categories.length === 0)) {
    return (
      <section className="admin__cat_list_grid" data-ready={String(ready)}>
        <div className="admin__cat_list_empty">No categories found</div>
      </section>
    )
  }

  const items = loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `sk-${i}` })) : categories

  return (
    <section className="admin__cat_list_grid" data-ready={String(ready)}>
      <ul className="admin__cat_list_list" aria-busy={loading}>
        {items.map((c, i) => (
          <li key={c.id || i} className="admin__cat_list_item" style={{ '--i': i }}>
            {loading ? (
              <article className="admin__cat_list_item_card admin__cat_list_item_card--skeleton">
                <div className="admin__cat_list_item_media">
                  <div className="admin__cat_list_item_img_skeleton skeleton-block" aria-hidden="true" />
                </div>
                <div className="admin__cat_list_item_body">
                  <div className="admin__cat_list_item_name_skeleton skeleton-block" aria-hidden="true" />
                  <div className="admin__cat_list_item_desc_skeleton skeleton-block" aria-hidden="true" />
                  <div className="admin__cat_list_item_desc_skeleton_2 skeleton-block" aria-hidden="true" />
                </div>
              </article>
            ) : (
              <CatListItem category={c} onEdit={onEdit} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
