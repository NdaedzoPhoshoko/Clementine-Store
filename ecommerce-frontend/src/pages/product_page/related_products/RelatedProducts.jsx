import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useFetchBrowseProducts from '../../../hooks/useFetchBrowseProducts.js';
import ProdGrid from '../../../components/products_grid/ProdGrid.jsx';
import './RelatedProducts.css';

export default function RelatedProducts({ categoryId, categoryName, currentProductId }) {
  const [cols, setCols] = useState(4);
  const { items, loading, error } = useFetchBrowseProducts({ initialPage: 1, limit: 12, categoryId, inStock: true, enabled: !!categoryId });

  // Compute how many cards to show based on screen size
  useEffect(() => {
    const computeCols = () => {
      const w = window.innerWidth || 1024;
      if (w < 640) setCols(1);
      else if (w < 768) setCols(2);
      else if (w < 1024) setCols(3);
      else if (w < 1280) setCols(4);
      else setCols(5);
    };
    computeCols();
    window.addEventListener('resize', computeCols);
    return () => window.removeEventListener('resize', computeCols);
  }, []);



  const filteredItems = Array.isArray(items)
    ? items.filter(p => (p?.id ?? p?.product_id) !== currentProductId)
    : [];
  const displayItems = filteredItems.slice(0, cols);
  const toSlug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const viewAllTo = categoryName ? `/shop-all?category=${toSlug(categoryName)}` : '/shop-all';

  if (!loading && (!categoryId || error || displayItems.length === 0)) {
    return null;
  }

  return (
    <section className="related-products" aria-label="Related products">
      {loading ? (
        <div className="related-products__header-skeleton">
          <div className="rp-skeleton related-products__title-skeleton" aria-hidden="true"></div>
          <div className="rp-skeleton related-products__view-all-skeleton" aria-hidden="true"></div>
        </div>
      ) : (
        <div className="related-products__header">
          <h2 className="related-products__title">Related Products</h2>
          <Link className="related-products__view-all" to={viewAllTo}>View All</Link>
        </div>
      )}
      <div className="related-products__grid" style={{ '--cols': cols }}>
        <ProdGrid products={displayItems} loading={loading} className="related-one-row" ariaLabel="Related products" />
      </div>
    </section>
  );
}
