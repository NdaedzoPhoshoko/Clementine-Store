import React, { useMemo, useState, useEffect } from "react";
import "./ShopAll.css";
import ProdGrid from "../../components/products_grid/ProdGrid";
import useFetchBrowseProducts from "../../hooks/useFetchBrowseProducts.js";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";
import { useNavigate, useLocation } from "react-router-dom";
import PriceRangeSlider from "../../components/filters/PriceRangeSlider";
import ErrorModal from "../../components/modals/ErrorModal";

export default function ShopAll() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catQuery, setCatQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [priceTempMin, setPriceTempMin] = useState(null);
  const [priceTempMax, setPriceTempMax] = useState(null);
  // Responsive items per page based on screen width
  const [itemsPerPage, setItemsPerPage] = useState(12);
  useEffect(() => {
    const compute = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      let next = 12;
      if (w >= 1280) next = 20;       // xl: 5 cols × 4 rows
      else if (w >= 1024) next = 16;  // lg: 4 cols × 4 rows
      else if (w >= 768) next = 12;   // md: 3 cols × 4 rows
      else next = 8;                  // sm/xs: 2 cols × 4 rows
      setItemsPerPage(next);
    };
    compute();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', compute, { passive: true });
      return () => window.removeEventListener('resize', compute);
    }
  }, []);

  const {
    page,
    setPage,
    pageItems,
    loading,
    error,
    meta,
  } = useFetchBrowseProducts({
    initialPage: 1,
    limit: itemsPerPage,
    search: query,
    categoryId: selectedCatId,
    minPrice,
    maxPrice,
    inStock: inStockOnly,
    enabled: true,
  });

  // Reset to first page when itemsPerPage changes to keep full rows
  useEffect(() => {
    setPage(1);
  }, [itemsPerPage, setPage]);

  const { categories, loading: catLoading } = useFetchCategoryNames({ page: 1, limit: 40 });

  const filteredCategories = useMemo(() => {
    const arr = Array.isArray(categories) ? categories : [];
    const q = String(catQuery || "").toLowerCase().trim();
    const byQuery = q ? arr.filter(c => String(c.name || "").toLowerCase().includes(q)) : arr;
    return byQuery.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [categories, catQuery]);

  // Read URL → state (on external navigation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incoming = params.get("search") || params.get("q") || "";
    if (incoming !== query) {
      setQuery(incoming || "");
      setPage(1);
    }
    // Map ?category=<slug> to selectedCatId
    const catSlug = params.get("category");
    if (!catSlug) {
      if (selectedCatId !== null) {
        setSelectedCatId(null);
        setPage(1);
      }
    } else if (Array.isArray(categories) && categories.length) {
      const match = categories.find((c) =>
        String(c.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === catSlug
      );
      const nextId = match ? match.id : null;
      if (nextId !== selectedCatId) {
        setSelectedCatId(nextId);
        setPage(1);
      }
    }
  }, [location.search, categories]);

  // Sync state → URL (for breadcrumbs and sharing)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(page));
    if (query) params.set("search", query); else params.delete("search");
    // Write category slug for readability; remove legacy numeric id
    if (selectedCatId && Array.isArray(categories)) {
      const selected = categories.find((c) => c.id === selectedCatId);
      const catSlug = selected ? String(selected.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "";
      if (catSlug) params.set("category", catSlug); else params.delete("category");
    } else {
      params.delete("category");
    }
    params.delete("categoryId");
    if (minPrice) params.set("minPrice", String(minPrice)); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", String(maxPrice)); else params.delete("maxPrice");
    if (inStockOnly) params.set("inStock", "true"); else params.delete("inStock");
    if (sort && sort !== "relevance") params.set("sort", sort); else params.delete("sort");
    const nextSearch = params.toString() ? `?${params.toString()}` : "";
    if (nextSearch !== location.search) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [page, query, selectedCatId, minPrice, maxPrice, inStockOnly, sort, categories]);

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

  // Compute min/max across currently displayed products for slider bounds
  const priceStats = useMemo(() => {
    const arr = Array.isArray(displayProducts) ? displayProducts : [];
    let min = Infinity;
    let max = -Infinity;
    for (const p of arr) {
      const v = Number(p.price || 0);
      if (Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = 0;
    if (min > max) { min = 0; max = 0; }
    return { min, max };
  }, [displayProducts]);

  // Initialize temp values from URL or defaults, and refresh when bounds become available
  useEffect(() => {
    const defaultMin = 0;
    const defaultMax = 6000;
    const initialMin = minPrice !== "" ? Number(minPrice) : defaultMin;
    const initialMax = maxPrice !== "" ? Number(maxPrice) : defaultMax;

    const shouldInit =
      priceTempMin == null ||
      priceTempMax == null ||
      ((priceTempMin === 0 && priceTempMax === 0) && defaultMax > 0);

    if (shouldInit) {
      setPriceTempMin(Math.max(0, Math.min(initialMin, 6000)));
      setPriceTempMax(Math.max(0, Math.min(initialMax, 6000)));
    }
  }, [minPrice, maxPrice, priceTempMin, priceTempMax]);

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
            <div className="filter-field">
              <PriceRangeSlider
                min={0}
                max={6000}
                valueMin={priceTempMin ?? 0}
                valueMax={priceTempMax ?? 6000}
                step={50}
                onDebouncedChange={(lo, hi) => {
                  setPriceTempMin(lo);
                  setPriceTempMax(hi);
                  setMinPrice(String(lo));
                  setMaxPrice(String(hi));
                  setPage(1);
                }}
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
            <div className="filter-list" aria-busy={catLoading ? "true" : undefined}>
              <div className="filter-list__search">
                <input
                  type="text"
                  className="filter-input form-control"
                  placeholder="Search by Category"
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                  aria-label="Search by category"
                />
              </div>
              {catLoading ? (
                <div className="filter-list__hint">Loading...</div>
              ) : Array.isArray(filteredCategories) && filteredCategories.length ? (
                <div className="filter-list__items" role="radiogroup" aria-label="Category filters">
                  {filteredCategories.map((c) => (
                    <label key={c.id} className="filter-list__item">
                      <input
                        type="radio"
                        name="category"
                        className="filter-radio filter-checkbox"
                        checked={selectedCatId === c.id}
                        onChange={(e) => e.target.checked && setSelectedCatId(c.id)}
                        aria-checked={selectedCatId === c.id ? "true" : "false"}
                      />
                      <span className="filter-list__name">{c.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="filter-list__hint">No categories</div>
              )}
            </div>
          </div>
        </aside>

        <div className="shop-results">
          <header className="shop-results__header">
            <h1 className="shop-title">Shop All</h1>
          </header>
          
          {error && (
            <ErrorModal 
              message="Could not load products" 
              onClose={() => {}} 
            />
          )}

          {error ? (
            <div className="shop-empty" role="status" aria-live="polite">
              <img
                className="shop-empty__img"
                src="/illustrations/hand-drawn-no-data-illustration.png"
                alt="Database error illustration"
                loading="lazy"
              />
              <div className="shop-empty__title">Database connection issue</div>
              <div className="shop-empty__desc">We're having trouble connecting to our database. Please try again later or contact support if the issue persists.</div>
            </div>
          ) : isEmpty ? (
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

              <section className="shop-trust" aria-label="Clementine Store Trust">
                <p className="shop-trust__text">
                  Shop with confidence at <strong>Clementine Store</strong>, where every purchase is protected by secure payments, trusted delivery, and real-time order tracking. We’re committed to providing <strong>high-quality products</strong>, <strong>transparent pricing</strong>, and <strong>easy, hassle-free returns</strong>—all backed by friendly customer support that’s always ready to help. Whether you’re shopping for the latest trends, everyday essentials, or unique finds, Clementine Store ensures a seamless and enjoyable experience from start to finish. Discover a place where trust meets convenience, and where your satisfaction is our top priority.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}