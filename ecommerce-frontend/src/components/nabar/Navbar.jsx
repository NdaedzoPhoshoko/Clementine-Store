import React, { useState, useEffect, useRef } from "react";
import "./navbar.css";
import AccountAvatar from "../account_avatar/AccountAvatar.jsx";
import { authStorage } from "../../hooks/use_auth/authStorage.js";
import useAuthLogOut from "../../hooks/use_auth/useAuthLogOut.js";
import useFetchCategoryNames from "../../hooks/useFetchCategoryNames.js";
import useFetchAutocomplete from "../../hooks/useFetchAutocomplete.js";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["Orange hoodie", "Leather wallet", "Sneakers"]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout, loading: logoutLoading } = useAuthLogOut();

  // Skeleton loading for Home mega menu images
  const HOME_IMG_COUNT = 6;
  const [homeLoadedCount, setHomeLoadedCount] = useState(0);
  const [homeImagesReady, setHomeImagesReady] = useState(false);
  const markHomeImgLoaded = () => {
    setHomeLoadedCount((c) => {
      const next = c + 1;
      if (next >= HOME_IMG_COUNT) setHomeImagesReady(true);
      return next;
    });
  };
  const navCenterRef = useRef(null);
  const accountRef = useRef(null);
  // Delayed close timer for account dropdown
  const closeTimerRef = useRef(null);
  const DELAY_CLOSE_MS = 300;
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setShowAccountDropdown(false);
    }, DELAY_CLOSE_MS);
  };

  // Home menu tags with images; used to render grid with skeletons
  const homeTags = [
    { key: 'trending', label: 'Trending Now', to: '/trending', img: '/images/imageNoVnXXmDNi0.png' },
    { key: 'new-arrivals', label: 'New Arrivals', to: '/new-arrivals', img: '/images/imageNoVnXXmDNi0.png' },
    { key: 'featured', label: 'Featured Collections', to: '/featured', img: '/images/imageNoVnXXmDNi0.png' },
    { key: 'top-rated', label: 'Top Rated', to: '/top-rated', img: '/images/imageNoVnXXmDNi0.png' },
    { key: 'weekly-deals', label: 'Weekly Deals', to: '/weekly-deals', img: '/images/imageNoVnXXmDNi0.png' },
    { key: 'gift-ideas', label: 'Gift Ideas', to: '/gift-ideas', img: '/images/imageNoVnXXmDNi0.png' },
  ];
  const [homeLoaded, setHomeLoaded] = useState({});
  const markLoaded = (key) => setHomeLoaded((prev) => ({ ...prev, [key]: true }));
  const { names, loading: namesLoading, error: namesError } = useFetchCategoryNames({ page: 1, limit: 40 });
  const { bucket, categories, total, loading: autoLoading, error: autoError } = useFetchAutocomplete({ q: searchQuery, limit: 16, enabled: !!searchQuery.trim() });
  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  // Recent cache load & persist
  const RECENT_KEY = 'recent-searches:v1';
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(RECENT_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            setRecentSearches(arr.filter(Boolean).slice(0, 3));
          }
        }
      }
    } catch (e) {}
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.slice(0, 3)));
      }
    } catch (e) {}
  }, [recentSearches]);

  const removeRecent = (s) => {
    setRecentSearches((prev) => prev.filter((x) => x.toLowerCase() !== String(s).toLowerCase()));
  };

  // Combine matching recents (top 2) with suggestions; only show recents that match query
  const queryLower = searchQuery.trim().toLowerCase();
  const matchingRecents = queryLower
    ? recentSearches.filter((r) => String(r).toLowerCase().includes(queryLower)).slice(0, 2)
    : recentSearches.slice(0, 2);
  const lowerRecents = new Set(matchingRecents.map((r) => String(r).toLowerCase()));
  const filteredBucket = bucket.filter((b) => !lowerRecents.has(String(b).toLowerCase()));
  const combinedSuggestions = [...matchingRecents, ...filteredBucket];

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setShowAccountDropdown(false);
      }
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
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowAccountDropdown(false);
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
    navigate(`/shop-all?search=${encodeURIComponent(q)}`);
  };

  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-bar__inner">
        <div className="nav-left">
          <Link to="/" className="nav-brand" aria-label="Home">
            <span className="nav-brand__text">Clementine</span>
          </Link>
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
                <div className="search-section" aria-label="Suggestions">
                  <div className="search-section-title">Suggestions</div>
                  <div className="search-meta" role="status" aria-live="polite">
                    {searchQuery.trim() ? (
                      autoLoading ? <span>Searching...</span> : null
                    ) : null}
                    {autoError && <span className="search-error">Error loading</span>}
                  </div>
                  <ul className="search-list search-list--results">
                    {searchQuery.trim() ? (
                      autoLoading ? (
                        <>
                          <li className="search-item search-item--loading">...</li>
                          <li className="search-item search-item--loading">...</li>
                          <li className="search-item search-item--loading">...</li>
                          <li className="search-item search-item--loading">...</li>
                        </>
                      ) : combinedSuggestions.length ? (
                        combinedSuggestions.slice(0, 12).map((t) => {
                          const isRecent = lowerRecents.has(String(t).toLowerCase());
                          const isCategory = categories && categories.some((c) => String(c).toLowerCase() === String(t).toLowerCase());
                          return (
                            <li
                              key={`suggest-${t}`}
                              className="search-item"
                              onMouseDown={() => {
                                const to = isCategory
                                  ? `/shop-all?category=${slugify(t)}`
                                  : `/shop-all?search=${encodeURIComponent(t)}`;
                                setSearchQuery(t);
                                setShowSearchDropdown(false);
                                navigate(to);
                              }}
                            >
                              <span className="search-item__label">
                                <span className="search-item__text">{t}</span>
                                {categories && categories.some((c) => String(c).toLowerCase() === String(t).toLowerCase()) && (
                                  <span className="search-item__badge" aria-label="Category">Category</span>
                                )}
                              </span>
                              {isRecent && (
                                <span className="search-item__actions">
                                  <button
                                    type="button"
                                    className="search-item__delete"
                                    aria-label="Remove recent"
                                    title="Remove"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      removeRecent(t);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                      <path d="M10 11v6" />
                                      <path d="M14 11v6" />
                                      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                </span>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <li className="search-item muted">No matches</li>
                      )
                    ) : (
                      matchingRecents.length ? (
                        matchingRecents.map((t) => (
                          <li
                            key={`recent-${t}`}
                            className="search-item"
                            onMouseDown={() => {
                              const isCategory = categories && categories.some((c) => String(c).toLowerCase() === String(t).toLowerCase());
                              const to = isCategory
                                ? `/shop-all?category=${slugify(t)}`
                                : `/shop-all?search=${encodeURIComponent(t)}`;
                              setSearchQuery(t);
                              setShowSearchDropdown(false);
                              navigate(to);
                            }}
                          >
                            <span className="search-item__label">{t}</span>
                            <span className="search-item__actions">
                              <button
                                type="button"
                                className="search-item__delete"
                                aria-label="Remove recent"
                                title="Remove"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  removeRecent(t);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="search-item muted">Start typing to see results</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <nav className="nav-links" aria-label="Secondary navigation">
            <div className="nav-item">
              <Link
                to="/"
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
              </Link>
              {activeMenu === "home" && (
              <div className="nav-mega open" role="menu" aria-label="Home menu" id="menu-home" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Start Here</h4>
                  <p>Explore highlights from across the store: seasonal picks, editor‑curated collections, and what shoppers are loving right now. This is the quickest way to discover themes, styles, and best‑selling products without needing to search.</p>
                </div>
                <div className="mega-right">
                  {homeTags.map((t) => (
                    <Link key={t.key} to={t.to} className={`mega-tag ${homeLoaded[t.key] ? 'mega-tag--loaded' : 'mega-tag--loading'}`}>
                      <span className="mega-tag__label">{t.label}</span>
                      <div className="mega-tag__img-wrap">
                        {!homeLoaded[t.key] && <span className="mega-tag__skeleton" aria-hidden="true" />}
                        <img
                          src={t.img}
                          alt={t.label}
                          className="mega-tag__img"
                          loading="lazy"
                          decoding="async"
                          width="160"
                          height="100"
                          onLoad={() => markLoaded(t.key)}
                          onError={() => markLoaded(t.key)}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              )}
            </div>

            <div className="nav-item">
              <Link
                to="/shop-all"
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
              </Link>
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
                        <Link key={n} to={`/shop-all?category=${slugify(n)}`} className="mega-tag">{n}</Link>
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
              <Link
                to="/about"
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
              </Link>
              {activeMenu === "us" && (
              <div className="nav-mega open" role="menu" aria-label="About Us menu" id="menu-us" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Our Story</h4>
                  <p>We craft quality products with care and purpose. Learn about our mission, the team behind Clementine, and the practices that guide our design, sourcing, and sustainability commitments.</p>
                </div>
                <div className="mega-right">
                  <Link to="/about/mission" className="mega-tag">Mission</Link>
                  <Link to="/about/team" className="mega-tag">Team</Link>
                  <Link to="/about/sustainability" className="mega-tag">Sustainability</Link>
                  <Link to="/about/careers" className="mega-tag">Careers</Link>
                  <Link to="/about/press" className="mega-tag">Press</Link>
                  <Link to="/about/contact" className="mega-tag">Contact</Link>
                </div>
              </div>
              )}
            </div>

            <div className="nav-item">
              <Link
                to="/support"
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
              </Link>
              {activeMenu === "support" && (
              <div className="nav-mega open" role="menu" aria-label="Support menu" id="menu-support" onMouseLeave={() => setActiveMenu(null)}>
                <div className="mega-left">
                  <h4>Help Center</h4>
                  <p>Get help with orders, shipping, returns, and account questions. Find quick answers, track your order status, or reach our support team for personalized assistance when you need it.</p>
                </div>
                <div className="mega-right">
                  <Link to="/support/faq" className="mega-tag">FAQ</Link>
                  <Link to="/support/shipping" className="mega-tag">Shipping</Link>
                  <Link to="/support/returns" className="mega-tag">Returns</Link>
                  <Link to="/support/order-status" className="mega-tag">Order Status</Link>
                  <Link to="/support/contact" className="mega-tag">Contact Support</Link>
                  <Link to="/support/live-chat" className="mega-tag">Live Chat</Link>
                </div>
              </div>
              )}
            </div>
          </nav>
        </div>

        <div className="nav-right">
          <div
            className="nav-account"
            ref={accountRef}
            onMouseEnter={() => { cancelClose(); setShowAccountDropdown(true); }}
            onMouseLeave={scheduleClose}
          >
            <AccountAvatar />
            {showAccountDropdown && (
              <div className="account-dropdown" role="menu" aria-label="Account menu" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                <div className="account-card">
                  {(() => {
                    const user = authStorage.getUser();
                    const isAuthed = authStorage.isAuthenticated();
                    const displayName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Guest";
                    const initials = (displayName || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
                    return (
                      <>
                        <div className="account-card__intro">
                          {isAuthed
                            ? 'View your account to manage orders, addresses, and cart items. Log out anytime.'
                            : 'Sign in to browse products, track orders, and unlock exclusive deals.'}
                        </div>
                        <div className="account-card__header">
                          {isAuthed && initials ? (
                            <span className="account-avatar__circle account-avatar__circle--lg" aria-hidden="true">
                              <span className="account-avatar__initials">{initials}</span>
                            </span>
                          ) : (
                            <span className="account-card__avatar-icon" aria-hidden="true">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </span>
                          )}
                          <div className="account-card__identity">
                            <div className="account-card__name">{displayName}</div>
                          </div>
                        </div>
                        <div className="account-card__actions">
                          {isAuthed ? (
                            <>
                              <Link to="/account" className="account-btn account-btn--dark" onClick={() => setShowAccountDropdown(false)}>
                                View account
                              </Link>
                              <button
                                type="button"
                                className="account-btn account-btn--light"
                                disabled={logoutLoading}
                                onMouseDown={async () => {
                                  try {
                                    await logout();
                                  } catch {}
                                  setShowAccountDropdown(false);
                                  navigate('/');
                                }}
                              >
                                {logoutLoading ? 'Logging out…' : 'Log out'}
                              </button>
                            </>
                          ) : (
                            <>
                              <Link to="/auth/login" className="account-btn account-btn--light" onClick={() => setShowAccountDropdown(false)}>Log in</Link>
                              <Link to="/auth/signup" className="account-btn account-btn--dark" onClick={() => setShowAccountDropdown(false)}>Sign up</Link>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <Link to="/cart" className="nav-icon" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cart-counter" aria-label="Cart items count">0</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;