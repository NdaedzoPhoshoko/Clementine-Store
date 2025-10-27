import React, { useMemo } from "react";
import "./PaginationBar.css";

/**
 * PaginationBar — reusable pagination UI and logic
 *
 * Props:
 * - page: number (current page, 1-based)
 * - totalPages: number (total number of pages)
 * - hasPrev: boolean (whether previous page exists)
 * - hasNext: boolean (whether next page exists)
 * - onPageChange: (n: number) => void (navigate to page n)
 * - showHint?: boolean (show the hint text on wide screens)
 * - className?: string (additional class names)
 *
 * Mirrors the UX from ShopAll.jsx and keeps filters independent from pagination.
 */
export default function PaginationBar({
  page = 1,
  totalPages = 1,
  hasPrev = false,
  hasNext = false,
  onPageChange,
  showHint = true,
  className = "",
}) {
  const nextPages = useMemo(() => {
    const total = Math.max(Number(totalPages) || 1, 1);
    const current = Math.max(Number(page) || 1, 1);
    const arr = [];
    for (let i = current + 1; i <= Math.min(total, current + 3); i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  const lastIncluded = nextPages.length ? nextPages[nextPages.length - 1] : page;
  const showEllipsis = lastIncluded < totalPages - 1;
  const showLast = lastIncluded < totalPages;

  const goToPage = (n) => {
    if (typeof onPageChange !== "function") return;
    if (n < 1 || n > totalPages || n === page) return;
    onPageChange(n);
  };

  return (
    <nav className={`shop-pagination ${className}`} aria-label="Pagination">
      <button
        type="button"
        className={`shop-pagination__btn ${!hasPrev ? "is-disabled" : ""}`}
        onClick={() => hasPrev && goToPage(page - 1)}
        aria-disabled={!hasPrev ? "true" : undefined}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span className="shop-pagination__page is-active" aria-current="page">{page}</span>
      <button
        type="button"
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
          type="button"
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
          type="button"
          className="shop-pagination__page"
          onClick={() => goToPage(totalPages)}
          aria-label={`Go to last page (${totalPages})`}
        >
          {totalPages}
        </button>
      )}
      {showHint && <span className="shop-pagination__hint">select to navigate to a page</span>}
    </nav>
  );
}