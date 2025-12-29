import React from 'react'
import './AdminProdCard.css'
import { Star, Eye, Trash2 } from 'lucide-react'

export default function AdminProdCard({ product = {}, onEdit, onView, onDelete, showDelete = true }) {
  const {
    id,
    name = 'Untitled Product',
    description = '',
    price,
    image,
    rating = 0,
    reviewCount = 0,
  } = product || {}

  const priceText = typeof price === 'number' ? `R${price.toFixed(2)}` : (price || '—')
  const imgAlt = name || 'Product image'
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <article 
      className="admin__admin_prod_card_card" 
      aria-label={name} 
      tabIndex={0}
      onClick={() => onEdit && onEdit(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit && onEdit(id);
        }
      }}
    >
      <div className="admin__admin_prod_card_media">
        {image ? (
          <img className="admin__admin_prod_card_img" src={image} alt={imgAlt} />
        ) : (
          <div className="admin__admin_prod_card_img_skeleton skeleton-block" aria-hidden="true" />
        )}
        <button
          type="button"
          style={{display: "none"}}
          className="admin__admin_prod_card_view"
          aria-label="View product"
          onClick={(e) => {
            e.stopPropagation();
            onView && onView(id);
          }}
          onMouseUp={(e) => e.currentTarget.blur()}
        >
          <Eye size={18}/>
        </button>
        {showDelete && (
        <button
          type="button"
          className="admin__admin_prod_card_delete"
          aria-label="Delete product"
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(id);
          }}
          onMouseUp={(e) => e.currentTarget.blur()}
        >
          <Trash2 size={18} />
        </button>
        )}
      </div>
      <div className="admin__admin_prod_card_body">
        <h3 className="admin__admin_prod_card_name">{name}</h3>
        {description ? (
          <p className="admin__admin_prod_card_desc">{description}</p>
        ) : (
          <span className="admin__admin_prod_card_desc skeleton-block" aria-hidden="true" />
        )}
          <div className="admin__admin_prod_card_price_rating">
          <p className="admin__admin_prod_card_price">{priceText}</p>
          <div className="admin__admin_prod_card_rating" aria-label={`Rating ${roundedRating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={`star-${i}`}
                size={14}
                className="admin__admin_prod_card_star"
                fill="currentColor"
                stroke="none"
                style={{ opacity: i < roundedRating ? 1 : 0.3 }}
                aria-hidden="true"
              />
            ))}
            <span className="admin__admin_prod_card_review_count">({reviewCount})</span>
          </div>
        </div>
      </div>
    </article>
  )
}
