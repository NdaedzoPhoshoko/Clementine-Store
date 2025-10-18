import React from "react";
import "./ProdGrid.css";
import ProdCard from "./prod_card/ProdCard";

export default function ProdGrid({
  products = [],
  currency = "R",
  onAddToCart = () => {},
  className = "",
  ariaLabel = "Products",
}) {
  const cls = className ? `prod-grid ${className}` : "prod-grid";

  // Always render grid list; use placeholders when no products
  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: `placeholder-${i}`,
    image_url: "...",
    name: "...",
    description: "loading...",
    price: "00.00",
  }));
  const list = products && products.length > 0 ? products : placeholders;

  return (
    <section className={cls} aria-label={ariaLabel}>
      <div className="prod-grid__list" role="list">
        {list.map((p, i) => (
          <div role="listitem" key={p.id ?? `${p.name}-${i}`} className="prod-grid__item">
            <ProdCard
              id={p.id}
              imageUrl={p.image_url}
              name={p.name}
              description={p.description}
              price={p.price}
              currency={currency}
              onAddToCart={() => onAddToCart(p)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}