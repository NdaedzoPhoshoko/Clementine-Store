import React from "react";
import "./ProdCard.css";

export default function ProdCard({
  id,
  imageUrl,
  name,
  description,
  price,
  currency = "R",
  onAddToCart = () => {},
  isPlaceholder = false,
}) {
  const displayName = name || "Product";
  const priceDisplay = typeof price === "number" ? `${currency} ${price.toFixed(2)}` : `${currency} ${price || "0.00"}`;

  const handleView = () => {
    // Navigate or open modal to view product details
    // You can replace this with your router navigation
    console.log("view product", id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleView();
    }
  };

  return (
    <article
      className={`prod-card ${isPlaceholder ? "prod-card--skeleton" : ""}`}
      aria-label={isPlaceholder ? "Loading product" : `${displayName} — ${priceDisplay}`}
      onClick={isPlaceholder ? undefined : handleView}
      tabIndex={isPlaceholder ? -1 : 0}
      onKeyDown={isPlaceholder ? undefined : handleKeyDown}
      role={isPlaceholder ? undefined : "button"}
    >
      <div className="prod-card__media">
        {isPlaceholder ? (
          <div className="prod-card__img-skeleton skeleton-block" aria-hidden="true" />
        ) : (
          <>
            {/* Using img so product is not cropped; object-fit: contain preserves full product */}
            <img className="prod-card__img" src={imageUrl} alt={displayName} loading="lazy" />
            <button
              className="prod-card__add"
              aria-label={`Add ${displayName} to cart`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              +
              {/* Cart icon (inline SVG) */}
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6.2 6h13.02a1 1 0 0 1 .98 1.2l-1.6 8a1 1 0 0 1-.98.8H8.2a1 1 0 0 1-.98-.8L5.5 4.8 4 4H2.5a1 1 0 1 1 0-2H5c.43 0 .81.27.95.68L7 6Zm2.37 2 1.07 6h8.04l1.2-6H8.57Z"/>
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="prod-card__body">
        {isPlaceholder ? (
          <>
            <div className="prod-card__name-skeleton skeleton-block" aria-hidden="true"></div>
            <div className="prod-card__desc-skeleton skeleton-block" aria-hidden="true"></div>
            <div className="prod-card__price-skeleton skeleton-block" aria-hidden="true"></div>
          </>
        ) : (
          <>
            <h3 className="prod-card__name">{displayName}</h3>
            <p className="prod-card__desc">{description}</p>
            <div className="prod-card__price" aria-label={`Price ${priceDisplay}`}>{priceDisplay}</div>
          </>
        )}
      </div>
    </article>
  );
}