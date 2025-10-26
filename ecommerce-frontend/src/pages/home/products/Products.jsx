import React, { useEffect, useRef } from "react";
import "./Products.css";
import ProdGrid from "../../../components/products_grid/ProdGrid";
import useFetchNewProducts from "../../../hooks/useFetchNewProducts.js";

export default function Products({ title = "Find Products", products = [], onAddToCart = () => {}, onError = () => {} }) {
  const { products: fetchedProducts, loading, error } = useFetchNewProducts();

  const lastErrMsgRef = useRef(null);
  useEffect(() => {
    if (error) {
      const msg = typeof error === 'string' ? error : error?.message || String(error);
      if (lastErrMsgRef.current !== msg) {
        lastErrMsgRef.current = msg;
        onError(error);
      }
    }
  }, [error]);

  const gridProducts = Array.isArray(fetchedProducts) && fetchedProducts.length > 0 ? fetchedProducts : products;

  return (
    <section className="home-products" aria-label={title} aria-busy={loading ? "true" : undefined}>
      <div className="home-products__header">
        <h2 className="home-products__title">{title}</h2>
      </div>
      <ProdGrid
        products={gridProducts.map(product => ({
          ...product,
          averageRating: product.average_rating,
          reviewCount: product.review_count
        }))}
        loading={loading}
        onAddToCart={onAddToCart}
      />
      <div className="home-products__more">
        <a href="/shop-all" className="home-products__more-link" aria-label="View all products">
          <span>View more</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </a>
      </div>
    </section>
  );
}