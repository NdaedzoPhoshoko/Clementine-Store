import React, { useEffect, useState } from "react";
import "./ProdGrid.css";
import ProdCard from "./prod_card/ProdCard";

export default function ProdGrid({
  products = [],
  currency = "R",
  onAddToCart = () => {},
  className = "",
  ariaLabel = "Products",
  loading = false,
}) {
  const cls = className ? `prod-grid ${className}` : "prod-grid";

  // Smart Debounce:
  // If loading is true:
  // 1. If we have products (stale data), delay the skeleton to avoid flicker on fast loads.
  // 2. If we have NO products, show skeleton immediately to avoid empty white space.
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  
  useEffect(() => {
    if (loading) {
      if (products && products.length > 0) {
        // Stale data exists: debounce
        const t = setTimeout(() => setDebouncedLoading(true), 200);
        return () => clearTimeout(t);
      } else {
        // No data: immediate skeleton
        setDebouncedLoading(true);
      }
    } else {
      setDebouncedLoading(false);
    }
  }, [loading, products]);

  // When loading, render skeleton placeholders immediately
  const showSkeleton = debouncedLoading;
  
  // When loading or when products are empty, render skeleton placeholders to keep grid stable
  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: `placeholder-${i}`,
    image_url: null,
    name: null,
    description: null,
    price: null,
  }));
  
  // If explicitly loading, show placeholders.
  // If not loading but products is empty/undefined, also show placeholders (initial load safety).
  // Otherwise show actual products.
  const effectiveList = (showSkeleton || !products || products.length === 0) ? placeholders : products;

  return (
    <section className={cls} aria-label={ariaLabel} data-ready={showSkeleton ? "false" : "true"}>
      <div className="prod-grid__list" role="list" aria-busy={showSkeleton ? "true" : undefined}>
        {effectiveList.map((p, i) => (
          <div
            role="listitem"
            key={p.id ?? `${p.name}-${i}`}
            className={`prod-grid__item ${showSkeleton || String(p.id || '').startsWith('placeholder-') ? 'prod-grid__item--skeleton' : ''}`}
            style={{ "--i": i }}
          >
            <ProdCard
              id={p.id}
              imageUrl={p.image_url}
              name={p.name}
              description={p.description}
              price={p.price}
              currency={currency}
              averageRating={p.average_rating || p.averageRating || 0}
              reviewCount={p.review_count || p.reviewCount || 0}
              isPlaceholder={showSkeleton || String(p.id || '').startsWith('placeholder-')}
              onAddToCart={() => onAddToCart(p)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}