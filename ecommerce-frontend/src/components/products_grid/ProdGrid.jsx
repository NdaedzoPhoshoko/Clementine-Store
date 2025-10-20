import React from "react";
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

  // When loading or when products are empty, render skeleton placeholders to keep grid stable
  const isLoading = !!loading;
  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: `placeholder-${i}`,
    image_url: null,
    name: null,
    description: null,
    price: null,
  }));
  const list = isLoading ? placeholders : (products && products.length > 0 ? products : placeholders);

  return (
    <section className={cls} aria-label={ariaLabel}>
      <div className="prod-grid__list" role="list" aria-busy={isLoading ? "true" : undefined}>
        {list.map((p, i) => (
          <div
            role="listitem"
            key={p.id ?? `${p.name}-${i}`}
            className={`prod-grid__item ${isLoading || String(p.id || '').startsWith('placeholder-') ? 'prod-grid__item--skeleton' : ''}`}
          >
            <ProdCard
              id={p.id}
              imageUrl={p.image_url}
              name={p.name}
              description={p.description}
              price={p.price}
              currency={currency}
              isPlaceholder={isLoading || String(p.id || '').startsWith('placeholder-')}
              onAddToCart={() => onAddToCart(p)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}