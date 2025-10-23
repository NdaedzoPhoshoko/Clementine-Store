import React, { useMemo, useState } from "react";
import "./ShopAll.css";
import ProdGrid from "../../components/products_grid/ProdGrid";
import useFetchBrowseProducts from "../../hooks/useFetchBrowseProducts.js";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";

export default function ShopAll() {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(true);

  const {
    page,
    setPage,
    pageItems,
    loading,
    error,
    meta,
  } = useFetchBrowseProducts({
    initialPage: 1,
    limit: 12,
    search: query,
    categoryId: selectedCatId,
    minPrice,
    maxPrice,
    inStock: inStockOnly,
    enabled: true,
  });

  const { categories, loading: catLoading } = useFetchCategoryNames({ page: 1, limit: 40 });

  const displayProducts = useMemo(() => {
    let list = Array.isArray(pageItems) ? [...pageItems] : [];
    if (sort === "price-asc") list.sort((a, b) => (Number(a.price || 0) - Number(b.price || 0)));
    else if (sort === "price-desc") list.sort((a, b) => (Number(b.price || 0) - Number(a.price || 0)));
    else if (sort === "name-asc") list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return list;
  }, [pageItems, sort]);

  const isEmpty = !loading && Array.isArray(displayProducts) && displayProducts.length === 0;

  const totalPages = meta?.pages || 1;
  const hasPrev = !!meta?.hasPrev;
  const hasNext = !!meta?.hasNext;
  
  const goToPage = (n) => {
    if (n < 1 || n > totalPages || n === page) return;
    setPage(n);
  };
  
  const nextPages = useMemo(() => {
    const total = totalPages;
    const arr = [];
    for (let i = page + 1; i <= Math.min(total, page + 3); i++) arr.push(i);
    return arr;
  }, [page, totalPages]);
  const lastIncluded = nextPages.length ? nextPages[nextPages.length - 1] : page;
  const showEllipsis = lastIncluded < totalPages - 1;
  const showLast = lastIncluded < totalPages;

  return (
    <section className="shop-all" aria-label="Shop All">
      <div className="shop-layout">
        <aside className="shop-filters" aria-label="Filters">
          <div className="filters__header">
            <h2 className="filters__title">Filters</h2>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Search</div>
            <div className="filter-field">
              <input
                type="text"
                className="filter-input"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Price</div>
            <div className="filter-field filter-field--row">
              <input
                type="number"
                className="filter-input"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price"
              />
              <input
                type="number"
                className="filter-input"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
              />
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Sort</div>
            <div className="filter-field">
              <select
                className="filter-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A → Z</option>
              </select>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Availability</div>
            <div className="filter-field">
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  aria-label="Only show items in stock"
                />
                <span>In Stock only</span>
              </label>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Categories</div>
            <div className="filter-tags" aria-busy={catLoading ? "true" : undefined}>
              {catLoading ? (
                <span className="filter-tag muted" aria-disabled="true">Loading...</span>
              ) : Array.isArray(categories) && categories.length ? (
                categories.slice(0, 24).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`filter-tag ${selectedCatId === c.id ? "filter-tag--active" : ""}`}
                    onClick={() => setSelectedCatId(selectedCatId === c.id ? null : c.id)}
                    aria-pressed={selectedCatId === c.id ? "true" : "false"}
                  >
                    {c.name}
                  </button>
                ))
              ) : (
                <span className="filter-tag muted">No categories</span>
              )}
            </div>
          </div>
        </aside>

        <div className="shop-results">
          <header className="shop-results__header">
            <h1 className="shop-title">Shop All</h1>
            {error && <div className="shop-error" role="alert">Could not load products</div>}
          </header>

          {isEmpty ? (
            <div className="shop-empty" role="status" aria-live="polite">
              <img
                className="shop-empty__img"
                src="/illustrations/hand-drawn-no-data-illustration.png"
                alt="No products illustration"
                loading="lazy"
              />
              <div className="shop-empty__title">No products found</div>
              <div className="shop-empty__desc">Try adjusting filters or search terms.</div>
            </div>
          ) : (
            <>
              <ProdGrid products={displayProducts} loading={loading && page === 1} ariaLabel="All products" />
              <nav className="shop-pagination" aria-label="Pagination">
                <button
                  className={`shop-pagination__btn ${!hasPrev ? "is-disabled" : ""}`}
                  onClick={() => hasPrev && goToPage(page - 1)}
                  aria-disabled={!hasPrev ? "true" : undefined}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="shop-pagination__page is-active" aria-current="page">{page}</span>
                <button
                  className={`shop-pagination__btn ${!hasNext ? "is-disabled" : ""}`}
                  onClick={() => hasNext && goToPage(page + 1)}
                  aria-disabled={!hasNext ? "true" : undefined}
                  aria-label="Next page"
                >
                  ›
                </button>
                {nextPages.map((p) => (
                  <button
                    key={`next-${p}`}
                    className="shop-pagination__page"
                    onClick={() => goToPage(p)}
                    aria-label={`Go to page ${p}`}
                  >
                    {p}
                  </button>
                ))}
                {showEllipsis && <span className="shop-pagination__ellipsis" aria-hidden="true">…</span>}
                {showLast && (
                  <button
                    className="shop-pagination__page"
                    onClick={() => goToPage(totalPages)}
                    aria-label={`Go to last page (${totalPages})`}
                  >
                    {totalPages}
                  </button>
                )}
                <span className="shop-pagination__hint">select to navigate to a page</span>
              </nav>
            </>
          )}
        </div>
      </div>
    </section>
  );
}