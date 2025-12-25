import React from 'react'
import './CatListItem.css'
import { Pencil, Image as ImageIcon } from 'lucide-react'

export default function CatListItem({ category = {}, onEdit }) {
  const {
    id,
    name = 'Untitled Category',
    description = '',
    image,
    product_count
  } = category || {}

  const imgAlt = name || 'Category image'

  return (
    <article className="admin__cat_list_item_card" aria-label={name} tabIndex={0}>
      <div className="admin__cat_list_item_media">
        {image ? (
          <img className="admin__cat_list_item_img" src={image} alt={imgAlt} />
        ) : (
          <div className="admin__cat_list_item_placeholder">
            <ImageIcon size={32} strokeWidth={1.5} />
          </div>
        )}
        <button
          type="button"
          className="admin__cat_list_item_edit"
          aria-label="Edit category"
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(id);
          }}
          onMouseUp={(e) => e.currentTarget.blur()}
        >
          <Pencil size={18} />
        </button>
      </div>
      <div className="admin__cat_list_item_body">
        <h3 className="admin__cat_list_item_name">{name}</h3>
        {description ? (
          <p className="admin__cat_list_item_desc">{description}</p>
        ) : (
          <span className="admin__cat_list_item_desc skeleton-text" aria-hidden="true" style={{ opacity: 0.3 }}>No description</span>
        )}
        <div className="admin__cat_list_item_footer">
          {product_count !== undefined && (
            <span className="admin__cat_list_item_count">
              {product_count} {product_count === 1 ? 'Product' : 'Products'}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
