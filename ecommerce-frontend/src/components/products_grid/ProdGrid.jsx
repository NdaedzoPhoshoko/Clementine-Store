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

  // Debounce loading skeleton to avoid flicker on very fast responses
  const isLoading = !!loading;
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  useEffect(() => {
    let t;
    if (isLoading) {
      t = setTimeout(() => setShowSkeleton(true), 120);
    } else {
      setShowSkeleton(false);
    }
    return () => { if (t) clearTimeout(t); };
  }, [isLoading]);

  // When loading or when products are empty, render skeleton placeholders to keep grid stable
  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: `placeholder-${i}`,
    image_url: null,
    name: null,
    description: null,
    price: null,
  }));
  const list = showSkeleton ? placeholders : (products && products.length > 0 ? products : placeholders);

  return (
    <section className={cls} aria-label={ariaLabel} data-ready={showSkeleton ? "false" : "true"}>
      <div className="prod-grid__list" role="list" aria-busy={showSkeleton ? "true" : undefined}>
        {list.map((p, i) => (
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