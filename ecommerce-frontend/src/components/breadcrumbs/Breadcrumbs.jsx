import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";
import "./breadcrumbs.css";

function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function Breadcrumbs() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchTerm = searchParams.get("search") || searchParams.get("q") || "";
  const categoryIdParam = searchParams.get("categoryId");

  const pathSegments = location.pathname.split("/").filter(Boolean);
  // Do not render breadcrumbs on the home route
  if (pathSegments.length === 0) return null;

  const { categories } = useFetchCategoryNames({ page: 1, limit: 100 });
  const categoryLabel = useMemo(() => {
    if (!categoryIdParam || !Array.isArray(categories)) return null;
    const id = Number(categoryIdParam);
    const found = categories.find((c) => Number(c.id) === id);
    return found ? found.name : `Category #${id}`;
  }, [categoryIdParam, categories]);

  const items = [];
  // Always start with Home
  items.push({ label: "Home", to: "/" });


  if (pathSegments[0] === "shop-all") {
    if (searchTerm) {
      items.push({ label: "Search", to: "/shop-all" });
      items.push({ label: searchTerm, to: null });
    } else if (categoryLabel) {
      items.push({ label: "Category", to: "/shop-all" });
      items.push({ label: categoryLabel, to: null });
    } else {
      items.push({ label: "Shop All", to: "/shop-all" });
    }
  } else if (pathSegments[0] === "product") {
    const id = pathSegments[1];
    items.push({ label: "Product", to: "/shop-all" });
    items.push({ label: id ? `#${id}` : "Detail", to: null });
  } else {
    // Fallback: show capitalized segments
    pathSegments.forEach((seg, i) => {
      const to = "/" + pathSegments.slice(0, i + 1).join("/");
      const label = capitalize(seg.replace(/[-_]/g, " "));
      items.push({ label, to });
    });
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="breadcrumbs__item">
              {item.to && !isLast ? (
                <Link to={item.to} className="breadcrumbs__link">{item.label}</Link>
              ) : (
                <span className="breadcrumbs__current" aria-current="page">{item.label}</span>
              )}
              {!isLast && <span className="breadcrumbs__sep" aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}