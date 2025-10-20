import React, { useState, useEffect, useRef } from "react";
import "./navbar.css";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["Orange hoodie", "Leather wallet", "Sneakers"]);
  const mockResults = [
    "Orange hoodie",
    "Summer dress",
    "Running sneakers",
    "Leather wallet",
    "Smart watch",
    "Wireless earbuds",
    "Denim jacket",
    "Formal shirts",
    "Sneakers",
    "Sneaks"
  ];
  const navCenterRef = useRef(null);

  const { names, loading: namesLoading, error: namesError } = useFetchCategoryNames({ page: 1, limit: 12 });
  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowSearchDropdown(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (navCenterRef.current && !navCenterRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowSearchDropdown(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const commitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())];
      return next.slice(0, 3);
    });
    setShowSearchDropdown(false);
  };

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-bar__inner">
        <div className="nav-left">
          <a href="/" className="nav-brand" aria-label="Home">
            <span className="nav-brand__text">Clementine</span>
          </a>
        </div>

        <div className="nav-center" ref={navCenterRef}>
          <div className="nav-search">
            <input
              type="text"
              className="nav-search__input"
              placeholder="What are you looking for?"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch();
              }}
            />
            <button className="nav-search__btn" aria-label="Search" onMouseDown={commitSearch}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {showSearchDropdown && (
              <div className="search-dropdown" role="listbox" aria-label="Search suggestions">
                <div className="search-section" aria-label="Recent searches">
                  <div className="search-section-title">Recent searches</div>
                  <ul className="search-list">
                    {recentSearches.length ? (
                      recentSearches.slice(0, 2).map((s) => (
                        <li
                          key={`recent-${s}`}
                          className="search-item"
                          onMouseDown={() => {
                            setSearchQuery(s);
                            setShowSearchDropdown(false);
                          }}
                        >
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="search-item muted">No recent searches</li>
                    )}
                  </ul>
                </div>
                <div className="search-section" aria-label="Search results">
                  <div className="search-section-title">Search results</div>
                  <ul className="search-list search-list--results">
                    {searchQuery.trim() ? (
                      mockResults
                        .filter((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((t) => (
                          <li
                            key={`result-${t}`}
                            className="search-item"
                            onMouseDown={() => {
                              setSearchQuery(t);
                              setShowSearchDropdown(false);
                            }}
                          >
                            {t}
                          </li>
                        ))
                    ) : (
                      <li className="search-item muted">Start typing to see results</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <nav className="nav-links" aria-label="Secondary navigation">
            <div className="nav-item">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeMenu === "home"}
                aria-controls="menu-home"
                onMouseEnter={() => setActiveMenu("home")}
                onFocus={() => setActiveMenu("home")}
                onClick={() => {
                  setActiveMenu((prev) => (prev === "home" ? null : "home"));
                }}
              >
                Home
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {activeMenu === "home" && (
              <div className="nav-mega open" role="menu" aria-label="Home menu" id="menu-home" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Start Here</h4>
                  <p>Explore highlights from across the store: seasonal picks, editor‑curated collections, and what shoppers are loving right now. This is the quickest way to discover themes, styles, and best‑selling products without needing to search.</p>
                </div>
                <div className="mega-right">
                  <a href="#trending" className="mega-tag">Trending Now
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Trending Now" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                  <a href="#new-arrivals" className="mega-tag">New Arrivals
                    <img src="/images/imageNoVnXXmDNi0.png" alt="New Arrivals" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                  <a href="#featured" className="mega-tag">Featured Collections
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Featured Collections" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                  <a href="#top-rated" className="mega-tag">Top Rated
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Top Rated" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                  <a href="#weekly-deals" className="mega-tag">Weekly Deals
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Weekly Deals" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                  <a href="#gift-ideas" className="mega-tag">Gift Ideas
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Gift Ideas" className="mega-tag__img" loading="lazy" decoding="async" width="160" height="100" />
                  </a>
                </div>
              </div>
              )}
            </div>

            <div className="nav-item">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeMenu === "all"}
                aria-controls="menu-all"
                onMouseEnter={() => setActiveMenu("all")}
                onFocus={() => setActiveMenu("all")}
                onClick={() => {
                  setActiveMenu((prev) => (prev === "all" ? null : "all"));
                }}
              >
                Shop All
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {activeMenu === "all" && (
              <div className="nav-mega open" role="menu" aria-label="Shop All menu" id="menu-all" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>All Categories</h4>
                  <p>Browse our complete catalog across departments and collections. Use categories to narrow your search and jump straight to the products and styles that match your taste, budget, and occasion.</p>
                </div>
                <div className="mega-right">
                  {namesLoading ? (
                    <>
                      <a className="mega-tag" aria-disabled="true">...</a>
                      <a className="mega-tag" aria-disabled="true">...</a>
                      <a className="mega-tag" aria-disabled="true">...</a>
                      <a className="mega-tag" aria-disabled="true">...</a>
                      <a className="mega-tag" aria-disabled="true">...</a>
                      <a className="mega-tag" aria-disabled="true">...</a>
                    </>
                  ) : Array.isArray(names) && names.length > 0 ? (
                    <>
                      {names.slice(0, 12).map((n) => (
                        <a key={n} href={`#${slugify(n)}`} className="mega-tag">{n}</a>
                      ))}
                    </>
                  ) : (
                    <span className="mega-tag muted">please refresh to show categories</span>
                  )}
                </div>
              </div>
              )}
            </div>

            <div className="nav-item">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeMenu === "us"}
                aria-controls="menu-us"
                onMouseEnter={() => setActiveMenu("us")}
                onFocus={() => setActiveMenu("us")}
                onClick={() => {
                  setActiveMenu((prev) => (prev === "us" ? null : "us"));
                }}
              >
                About Us
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {activeMenu === "us" && (
              <div className="nav-mega open" role="menu" aria-label="About Us menu" id="menu-us" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Our Story</h4>
                  <p>We craft quality products with care and purpose. Learn about our mission, the team behind Clementine, and the practices that guide our design, sourcing, and sustainability commitments.</p>
                </div>
                <div className="mega-right">
                  <a href="#mission" className="mega-tag">Mission</a>
                  <a href="#team" className="mega-tag">Team</a>
                  <a href="#sustainability" className="mega-tag">Sustainability</a>
                  <a href="#careers" className="mega-tag">Careers</a>
                  <a href="#press" className="mega-tag">Press</a>
                  <a href="#contact" className="mega-tag">Contact</a>
                </div>
              </div>
              )}
            </div>

            <div className="nav-item">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={activeMenu === "support"}
                aria-controls="menu-support"
                onMouseEnter={() => setActiveMenu("support")}
                onFocus={() => setActiveMenu("support")}
                onClick={() => {
                  setActiveMenu((prev) => (prev === "support" ? null : "support"));
                }}
              >
                Support
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {activeMenu === "support" && (
              <div className="nav-mega open" role="menu" aria-label="Support menu" id="menu-support" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Help Center</h4>
                  <p>Get help with orders, shipping, returns, and account questions. Find quick answers, track your order status, or reach our support team for personalized assistance when you need it.</p>
                </div>
                <div className="mega-right">
                  <a href="#faq" className="mega-tag">FAQ</a>
                  <a href="#shipping" className="mega-tag">Shipping</a>
                  <a href="#returns" className="mega-tag">Returns</a>
                  <a href="#order-status" className="mega-tag">Order Status</a>
                  <a href="#contact-support" className="mega-tag">Contact Support</a>
                  <a href="#live-chat" className="mega-tag">Live Chat</a>
                </div>
              </div>
              )}
            </div>
          </nav>
        </div>

        <div className="nav-right">
          <a href="#account" className="nav-icon" aria-label="Account">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </a>
          <a href="#cart" className="nav-icon" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cart-counter" aria-label="Cart items count">0</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;