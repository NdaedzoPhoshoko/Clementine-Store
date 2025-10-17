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

  return (
    <section className={cls} aria-label={ariaLabel}>
      {products.length === 0 ? (
        <div className="prod-grid__empty">No products available yet.</div>
      ) : (
        <div className="prod-grid__list" role="list">
          {products.map((p, i) => (
            <div role="listitem" key={p.id ?? `${p.name}-${i}`} className="prod-grid__item">
              <ProdCard
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
      )}
    </section>
  );
}