import React from "react";
import "./Products.css";
import ProdGrid from "../../../components/products_grid/ProdGrid";

export default function Products({ title = "Featured Products", products = [], onAddToCart = () => {} }) {
  return (
    <section className="home-products" aria-label={title}>
      <div className="home-products__header">
        <h2 className="home-products__title">{title}</h2>
      </div>
      <ProdGrid products={products} onAddToCart={onAddToCart} />
      <div className="home-products__more">
        <a href="/shop-all" className="home-products__more-link" aria-label="View all products">
          <span>View more</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </a>
      </div>
    </section>
  );
}