import React, { useMemo, useState, useEffect } from "react";
import "./ShopAll.css";
import ProdGrid from "../../components/products_grid/ProdGrid";
import useFetchBrowseProducts from "../../hooks/useFetchBrowseProducts.js";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";
import { useNavigate, useLocation } from "react-router-dom";

export default function ShopAll() {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Sync filters and page to URL query so breadcrumbs can read them
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(page));
    if (query) params.set("search", query); else params.delete("search");
    if (selectedCatId) params.set("categoryId", String(selectedCatId)); else params.delete("categoryId");
    if (minPrice) params.set("minPrice", String(minPrice)); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", String(maxPrice)); else params.delete("maxPrice");
    if (inStockOnly) params.set("inStock", "true"); else params.delete("inStock");
    if (sort && sort !== "relevance") params.set("sort", sort); else params.delete("sort");
    const nextSearch = params.toString() ? `?${params.toString()}` : "";
    if (nextSearch !== location.search) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [page, query, selectedCatId, minPrice, maxPrice, inStockOnly, sort]);

  const displayProducts = useMemo(() => {
    let list = Array.isArray(pageItems) ? [...pageItems] : [];
    if (sort === "price-asc") list.sort((a, b) => (Number(a.price || 0) - Number(b.price || 0)));
    else if (sort === "price-desc") list.sort((a, b) => (Number(b.price || 0) - Number(a.price || 0)));
    else if (sort === "name-asc") list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    else if (sort === "name-desc") list.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
    return list;
  }, [pageItems, sort]);

  const isEmpty = !loading && Array.isArray(displayProducts) && displayProducts.length === 0;

  const totalPages = meta?.pages || 1;
  const hasPrev = !!meta?.hasPrev;
  const hasNext = !!meta?.hasNext;
  
  // Derived values for grouped sort dropdowns
  const sortPriceValue = sort.startsWith("price") ? sort : "";
  const sortNameValue = sort.startsWith("name") ? sort : "";
  const handlePriceSortChange = (val) => setSort(val || "relevance");
  const handleNameSortChange = (val) => setSort(val || "relevance");
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
                className="filter-input form-control"
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
                className="filter-input form-control"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price"
              />
              <input
                type="number"
                className="filter-input form-control"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
              />
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Sort</div>
            <div className="sort-grid">
              <div className="sort-group">
                <label className="filter-label form-label" htmlFor="sort-price">By Price</label>
                <select
                  id="sort-price"
                  className="filter-select form-select"
                  value={sortPriceValue}
                  onChange={(e) => handlePriceSortChange(e.target.value)}
                  aria-label="Sort by price"
                >
                  <option value="">None</option>
                  <option value="price-asc">Low to High</option>
                  <option value="price-desc">High to Low</option>
                </select>
              </div>
              <div className="sort-group">
                <label className="filter-label form-label" htmlFor="sort-name">By Name</label>
                <select
                  id="sort-name"
                  className="filter-select form-select"
                  value={sortNameValue}
                  onChange={(e) => handleNameSortChange(e.target.value)}
                  aria-label="Sort by name"
                >
                  <option value="">None</option>
                  <option value="name-asc">A → Z</option>
                  <option value="name-desc">Z → A</option>
                </select>
              </div>
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
              <ProdGrid products={displayProducts} loading={loading} ariaLabel="All products" />
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