import React, { useMemo, useState, useEffect } from "react";
import "./ShopAll.css";
import ProdGrid from "../../components/products_grid/ProdGrid";
import useFetchBrowseProducts from "../../hooks/useFetchBrowseProducts.js";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";
import { useNavigate, useLocation } from "react-router-dom";
import PriceRangeSlider from "../../components/filters/PriceRangeSlider";
import ErrorModal from "../../components/modals/ErrorModal";
import PaginationBar from "../../components/pagination/PaginationBar";

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
  const getDefaultItemsPerPage = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w >= 1280) return 20;
    if (w >= 1024) return 16;
    if (w >= 768) return 12;
    return 8;
  };
  const [itemsPerPage, setItemsPerPage] = useState(getDefaultItemsPerPage());
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
    loadingMore,
    error,
    meta,
    hasMore,
  } = useFetchBrowseProducts({
    initialPage: (() => {
      const params = new URLSearchParams(location.search || "");
      const pStr = params.get("page");
      const p = pStr ? parseInt(pStr, 10) : 1;
      return Number.isFinite(p) && p >= 1 ? p : 1;
    })(),
    limit: itemsPerPage,
    search: query,
    categoryId: selectedCatId,
    minPrice,
    maxPrice,
    inStock: inStockOnly,
    enabled: true,
  });
  
  // Disabled: page reset on itemsPerPage change (per user request)
  // const itemsPerPageDidMount = useRef(false);
  // useEffect(() => {
  //   if (itemsPerPageDidMount.current) {
  //     setPage(1);
  //   } else {
  //     itemsPerPageDidMount.current = true;
  //   }
  // }, [itemsPerPage]);

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
    }
    const catSlug = params.get("category");
    if (!catSlug) {
      if (selectedCatId !== null) {
        setSelectedCatId(null);
      }
    } else if (Array.isArray(categories) && categories.length) {
      const match = categories.find((c) =>
        String(c.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === catSlug
      );
      const nextId = match ? match.id : null;
      if (nextId !== selectedCatId) {
        setSelectedCatId(nextId);
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

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const displayProducts = useMemo(() => {
    let list = Array.isArray(pageItems) ? [...pageItems] : [];
    if (sort === "price-asc") list.sort((a, b) => (Number(a.price || 0) - Number(b.price || 0)));
    else if (sort === "price-desc") list.sort((a, b) => (Number(b.price || 0) - Number(a.price || 0)));
    else if (sort === "name-asc") list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    else if (sort === "name-desc") list.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
    return list;
  }, [pageItems, sort]);

  // If pageItems is undefined, it means we haven't fetched the data for this page yet.
  const isPageLoaded = Array.isArray(pageItems);
  const isActuallyLoading = loading || loadingMore || !isPageLoaded;

  const isEmpty = !isActuallyLoading && Array.isArray(displayProducts) && displayProducts.length === 0;

  const totalPages = meta?.pages || 1;
  const hasPrev = typeof meta?.hasPrev !== 'undefined' ? !!meta?.hasPrev : page > 1;
  const hasNext = typeof meta?.hasNext !== 'undefined' ? !!meta?.hasNext : !!hasMore;
  
  // Derived values for grouped sort dropdowns
  const sortPriceValue = sort.startsWith("price") ? sort : "";
  const sortNameValue = sort.startsWith("name") ? sort : "";
  const handlePriceSortChange = (val) => {
    setSort(val || "relevance");
    setPage(1);
  };
  const handleNameSortChange = (val) => {
    setSort(val || "relevance");
    setPage(1);
  };
  const goToPage = (n) => {
    const target = Number(n);
    if (!Number.isFinite(target)) return;
    if (target < 1 || target === page) return;
    setPage(target);
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

  // Clear-all filters derivation and handler
  const isDefaultFilters =
    (query === "") &&
    (minPrice === "" && maxPrice === "") &&
    (selectedCatId === null) &&
    (inStockOnly === true) &&
    (sort === "relevance") &&
    (catQuery === "");

  const handleClearFilters = () => {
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
    setPriceTempMin(0);
    setPriceTempMax(6000);
    setSelectedCatId(null);
    setInStockOnly(true);
    setSort("relevance");
    setCatQuery("");
    setPage(1);
  };

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

  const handlePriceChange = React.useCallback((lo, hi) => {
    setPriceTempMin(lo);
    setPriceTempMax(hi);
    setMinPrice(String(lo));
    setMaxPrice(String(hi));
    setPage(1);
  }, []);

  return (
    <section className="shop-all" aria-label="Shop All">
      <div className="shop-layout">
        <aside className="shop-filters" aria-label="Filters">
          <div className="filters__header">
            <h2 className="filters__title">Filters</h2>
            <button
              type="button"
              className="filters__clear-btn"
              onClick={handleClearFilters}
              disabled={isDefaultFilters}
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          </div>

          <div className="filter-section">
            <div className="filter-section__title">Search</div>
            <div className="filter-field">
              <input
                type="text"
                className="filter-input form-control"
                placeholder="Search products"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
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
                onDebouncedChange={handlePriceChange}
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
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
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
                <div className="filter-list__items filter-list__items--skeleton" aria-hidden="true">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="filter-list__item skeleton-item" role="presentation">
                      <span className="skeleton-block skeleton--checkbox" aria-hidden="true"></span>
                      <span className="skeleton-block skeleton--text" aria-hidden="true"></span>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(filteredCategories) && filteredCategories.length ? (
                <div className="filter-list__items" role="radiogroup" aria-label="Category filters">
                  {filteredCategories.map((c) => (
                    <label key={c.id} className="filter-list__item" onClick={(e) => { if (selectedCatId === c.id) { e.preventDefault(); setSelectedCatId(null); setPage(1); } }}>
                      <input
                        type="radio"
                        name="category"
                        className="filter-radio filter-checkbox"
                        checked={selectedCatId === c.id}
                        onChange={(e) => { if (e.target.checked) { setSelectedCatId(c.id); setPage(1); } }}
                        aria-checked={selectedCatId === c.id ? "true" : "false"}
                      />
                      <span
                        className="filter-list__name"
                        onClick={(e) => { if (selectedCatId === c.id) { e.preventDefault(); e.stopPropagation(); setSelectedCatId(null); setPage(1); } }}
                      >
                        {c.name}
                      </span>
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
              <ProdGrid products={displayProducts} loading={isActuallyLoading} ariaLabel="All products" />
              <PaginationBar
                page={page}
                totalPages={totalPages}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onPageChange={goToPage}
              />

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