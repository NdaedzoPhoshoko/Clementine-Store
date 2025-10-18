import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProdCard.css";

export default function ProdCard({
  id,
  imageUrl,
  name,
  description,
  price,
  currency = "R",
  onAddToCart = () => {},
}) {
  const navigate = useNavigate();

  const formatPrice = (val) => {
    if (typeof val === "number") {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val || "";
  };

  const displayName = typeof name === "string"
    ? (name.length > 20 ? name.slice(0, 23) + '...' : name)
    : "";
  const priceDisplay = `${currency} ${formatPrice(price)}`;

  const to = id ? `/product/${id}` : `/product/${encodeURIComponent((name || "view").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}`;
  const handleView = () => navigate(to);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleView();
    }
  };

  return (
    <article
      className="prod-card"
      aria-label={`${displayName} — ${priceDisplay}`}
      onClick={handleView}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
    >
      <div className="prod-card__media">
        {/* Using img so product is not cropped; object-fit: contain preserves full product */}
        <img className="prod-card__img" src={imageUrl} alt={displayName} loading="lazy" />
        <button
          className="prod-card__add"
          type="button"
          aria-label="Add to cart"
          onClick={(e) => { e.stopPropagation(); onAddToCart({ imageUrl, name, description, price }); }}
          title="Add to cart"
        >
          {/* Cart icon (inline SVG) */}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2  2 0 0 0 0-4ZM6.2 6h13.02a1 1 0 0 1 .98 1.2l-1.6 8a1 1 0 0 1-.98.8H8.2a1 1 0 0 1-.98-.8L5.5 4.8 4 4H2.5a1 1 0 1 1 0-2H5c.43 0 .81.27.95.68L7 6Zm2.37 2 1.07 6h8.04l1.2-6H8.57Z"/>
          </svg>
        </button>
      </div>

      <div className="prod-card__body">
        <h3 className="prod-card__name">{displayName}</h3>
        <p className="prod-card__desc">{description}</p>
        <div className="prod-card__price" aria-label={`Price ${priceDisplay}`}>{priceDisplay}</div>
      </div>
    </article>
  );
}