import React from 'react';
import './AdminDashboard.css';
import useAuthUser from '../../../hooks/use_auth/useAuthUser.js';
import ErrorModal from '../../../components/modals/ErrorModal.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import apiFetch from '../../../utils/apiFetch.js';
import useFetchTopCategories from '../../../hooks/admin_dashboard/useFetchTopCategories.js';

const ph = '/images/imageNoVnXXmDNi0.png';

export default function AdminDashboard() {
  const { user: authUser } = useAuthUser();
  const name = authUser?.name ? authUser.name.split(' ')[0] : '';
  const navigate = useNavigate();
  const [invItems, setInvItems] = useState([]);
  const [invMeta, setInvMeta] = useState(null);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState(null);
  const [invSearch, setInvSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [catsErrorMsg, setCatsErrorMsg] = useState('');

  const demoInv = [
    { id: 101, product_id: 501, product_name: 'Aurora Jacket', change_type: 'RESTOCK', quantity_changed: 40, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 102, product_id: 502, product_name: 'Fame Satin Dress', change_type: 'SALE', quantity_changed: 2, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 103, product_id: 503, product_name: 'Midnight Denim', change_type: 'RESTOCK', quantity_changed: 60, created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 104, product_id: 504, product_name: 'Carter Boots', change_type: 'SALE', quantity_changed: 1, created_at: new Date(Date.now() - 5400000).toISOString() },
    { id: 105, product_id: 505, product_name: 'Classic Tee', change_type: 'SALE', quantity_changed: 3, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 106, product_id: 506, product_name: 'Essentials Hoodie', change_type: 'RESTOCK', quantity_changed: 25, created_at: new Date(Date.now() - 259200000).toISOString() },
    { id: 107, product_id: 507, product_name: 'Sierra Coat', change_type: 'SALE', quantity_changed: 1, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 108, product_id: 508, product_name: 'Luna Skirt', change_type: 'SALE', quantity_changed: 2, created_at: new Date(Date.now() - 28800000).toISOString() },
    { id: 109, product_id: 509, product_name: 'Harbor Sneakers', change_type: 'RESTOCK', quantity_changed: 30, created_at: new Date(Date.now() - 432000000).toISOString() },
    { id: 110, product_id: 510, product_name: 'Willow Blouse', change_type: 'SALE', quantity_changed: 1, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 111, product_id: 511, product_name: 'Ridge Knit', change_type: 'RESTOCK', quantity_changed: 50, created_at: new Date(Date.now() - 604800000).toISOString() },
    { id: 112, product_id: 512, product_name: 'Opal Dress', change_type: 'SALE', quantity_changed: 1, created_at: new Date(Date.now() - 21600000).toISOString() }
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      setInvLoading(true);
      setInvError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        const res = await apiFetch(`/api/inventory-logs?${params.toString()}`, { headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        setInvItems(Array.isArray(payload?.items) ? payload.items : []);
        setInvMeta(payload?.meta || null);
      } catch (e) {
        setInvError(e);
      } finally {
        setInvLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const sourceItems = useMemo(() => invItems.concat(demoInv), [invItems]);
  const filteredItems = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    if (!q) return sourceItems;
    const isNum = /^\d+$/.test(q);
    return sourceItems.filter((it) => {
      const byName = String(it.product_name || '').toLowerCase().includes(q);
      const byType = String(it.change_type || '').toLowerCase().includes(q);
      const byId = isNum && String(it.product_id || '').toLowerCase() === q;
      return byName || byType || byId;
    });
  }, [sourceItems, invSearch]);

  const { items: topCats, trendyProduct, loading: topCatsLoading, error: topCatsError } = useFetchTopCategories({ period: 'all_time', paidOnly: true, page: 1, limit: 12 });
  const tp = trendyProduct;
  const tpTitle = String(tp?.product_name || '').trim();
  const heroTitle = tpTitle.length > 40 ? tpTitle.slice(0, 40) + '…' : tpTitle;
  const heroDesc = String(tp?.product_description || '').trim();
  const heroNotes = String(tp?.sustainability_notes?.description || '').trim();

  useEffect(() => {
    if (topCatsError) {
      const msg = String(topCatsError?.message || 'Failed to load top categories').trim();
      setCatsErrorMsg(msg);
    }
  }, [topCatsError]);

  return (
    <div className="admin_dashboard__page">
      <div className="admin_dashboard__panel">
        <div className="admin_dashboard__content">
          {catsErrorMsg && (
            <ErrorModal message={catsErrorMsg} onClose={() => setCatsErrorMsg('')} />
          )}
          <div className="admin_dashboard__header">
            {name ? (
              <h1 className="admin_dashboard__greeting">Hello, <span className="admin_dashboard__greeting_accent">{name}</span>!</h1>
            ) : (
              <span className="skeleton-block admin_dashboard__header_skel_title" aria-hidden="true"></span>
            )}
            <div className="admin_dashboard__header_right">
              <div className="admin_dashboard__search">
                <input
                  type="text"
                  className="admin_dashboard__search_input"
                  placeholder="Search Category"
                  aria-label="Search"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                />
                <button className="admin_dashboard__search_btn" aria-label="Search" onMouseDown={(e) => e.currentTarget.blur()}>
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
              </div>
              <div className="admin_dashboard__header_actions">
                <button className="admin_dashboard__icon_btn" aria-label="Notifications" />
                <button className="admin_dashboard__icon_btn" aria-label="Profile" />
              </div>
            </div>
          </div>

          <div className="admin_dashboard__top">
            <div className={`admin_dashboard__hero ${topCatsLoading || !tp ? 'admin_dashboard__hero--loading' : ''}`}>
              {topCatsLoading || !tp ? (
                <span className="skeleton-block admin_dashboard__hero_skel_full" aria-hidden="true"></span>
              ) : (
                <>
                  <div className="admin_dashboard__badge">Latest Trendy Product</div>
                  <div className="admin_dashboard__hero_title">{heroTitle}</div>
                  {heroDesc && <div className="admin_dashboard__hero_desc">{heroDesc}</div>}
                  {heroNotes && <div className="admin_dashboard__hero_sub">{heroNotes}</div>}
                  <div className="admin_dashboard__hero_actions">
                    <button className="admin_dashboard__hero_cta" aria-label="Manage products" onClick={() => navigate('/admin/product_management')}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      Manage Products
                    </button>
                    <span className="admin_dashboard__hero_reviews">Reviews: {Number(tp?.product_review_count || 0)}</span>
                  </div>
                  <img src={tp?.product_image || ph} alt="Featured collection" className="admin_dashboard__hero_img" />
                </>
              )}
            </div>
            <div className="admin_dashboard__list">
              <div className="admin_dashboard__list_header">
                <span className="admin_dashboard__list_title">Top Categories</span>
                <button className="admin_dashboard__see_more" aria-label="See more">See More</button>
              </div>
              <ul className="admin_dashboard__chips" aria-label="Top categories">
                {topCatsLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <li key={`chips-skel-${i}`} className="admin_dashboard__chip">
                      <span className="skeleton-block admin_dashboard__chip_skel_avatar" aria-hidden="true"></span>
                      <div className="admin_dashboard__chip_text">
                        <span className="skeleton-block admin_dashboard__chip_skel_name" aria-hidden="true"></span>
                        <span className="skeleton-block admin_dashboard__chip_skel_meta" aria-hidden="true"></span>
                      </div>
                    </li>
                  ))
                ) : topCatsError ? (
                  <li className="admin_dashboard__chip">
                    <img src={ph} alt="" className="admin_dashboard__chip_avatar" />
                    <div className="admin_dashboard__chip_text">
                      <span className="admin_dashboard__chip_name">Error loading</span>
                      <span className="admin_dashboard__chip_meta">Try again later</span>
                    </div>
                  </li>
                ) : Array.isArray(topCats) && topCats.length > 0 ? (
                  topCats.map((c) => (
                    <li key={String(c.category_id || c.id || c.category_name)} className="admin_dashboard__chip">
                      <img src={ph} alt="" className="admin_dashboard__chip_avatar" />
                      <div className="admin_dashboard__chip_text">
                        <span className="admin_dashboard__chip_name">{c.category_name || c.name}</span>
                        <span className="admin_dashboard__chip_meta">{typeof c.items_sold === 'number' ? `Sold ${c.items_sold} Items` : 'Sold '+ String(c.items_sold || '0') + ' Items'}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="admin_dashboard__chip">
                    <img src={ph} alt="" className="admin_dashboard__chip_avatar" />
                    <div className="admin_dashboard__chip_text">
                      <span className="admin_dashboard__chip_name">No categories</span>
                      <span className="admin_dashboard__chip_meta">No sales data</span>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="admin_dashboard__section_row">
            <div className="admin_dashboard__section_label">Admin Controls</div>
            <button className="admin_dashboard__see_more" aria-label="See more">See More</button>
          </div>
          <div className="admin_dashboard__grid">
            {[
              { key: 'orders', label: 'Order Management', to: '/admin-orders' },
              { key: 'inventory', label: 'Product/Inventory', to: '/admin-product_management' },
              { key: 'customers', label: 'Customers', to: '/admin-customers' },
              { key: 'analytics', label: 'Analytics/Reporting', to: '/admin-analytics' },
              { key: 'marketing', label: 'Marketing', to: '/admin-marketing' },
              { key: 'settings', label: 'Settings', to: '/admin/settings' },
            ].map((c) => (
              <Link key={c.key} to={c.to} className="admin_dashboard__control_card">
                <span className={`admin_dashboard__control_icon admin_dashboard__control_icon--${c.key}`} aria-hidden="true">
                  {c.key === 'orders' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
                  )}
                  {c.key === 'inventory' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  )}
                  {c.key === 'customers' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="4"/><circle cx="18" cy="8" r="3"/><path d="M4 21v-2a4 4 0 0 1 4-4h2"/><path d="M14 21v-2a3 3 0 0 1 3-3h1"/></svg>
                  )}
                  {c.key === 'analytics' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="9" width="3" height="9"/><rect x="17" y="6" width="3" height="12"/></svg>
                  )}
                  {c.key === 'marketing' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-7v16l-18-7z"/><path d="M7 12v7"/></svg>
                  )}
                  {c.key === 'settings' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .66.38 1.25 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.14-.33 1.82v.01c.26.62.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.25.38-1.51 1z"/></svg>
                  )}
                </span>
                <span className="admin_dashboard__control_label">{c.label}</span>
              </Link>
            ))}
          </div>

          <div className="admin_dashboard__bar" aria-label="Inventory logs">
            <div className="admin_dashboard__bar_header">
              <div className="admin_dashboard__bar_texts">
                <div className="admin_dashboard__bar_title">Inventory Logs</div>
                <div className="admin_dashboard__bar_sub">Track product changes and stock adjustments</div>
              </div>
              <div className="admin_dashboard__bar_search">
                <input
                  type="text"
                  className="admin_dashboard__bar_search_input"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Search by name, type or product ID"
                  aria-label="Search inventory logs"
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                />
                <button className="admin_dashboard__bar_search_btn" aria-label="Search" onMouseDown={(e) => e.currentTarget.blur()}>
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
              </div>
            </div>
            <div className="admin_dashboard__bar_list">
              <table className="admin_dashboard__table">
                <thead className="admin_dashboard__thead">
                  <tr className="admin_dashboard__row">
                    <th className="admin_dashboard__cell admin_dashboard__cell--th admin_dashboard__cell--inv">Product ID</th>
                    <th className="admin_dashboard__cell admin_dashboard__cell--th admin_dashboard__cell--product">Product</th>
                    <th className="admin_dashboard__cell admin_dashboard__cell--th admin_dashboard__cell--type">Type</th>
                    <th className="admin_dashboard__cell admin_dashboard__cell--th admin_dashboard__cell--qty">Qty</th>
                    <th className="admin_dashboard__cell admin_dashboard__cell--th admin_dashboard__cell--date">Date</th>
                  </tr>
                </thead>
                <tbody className="admin_dashboard__tbody">
                  {invLoading ? (
                    <tr className="admin_dashboard__row"><td className="admin_dashboard__cell" colSpan={5}>Loading…</td></tr>
                  ) : invError ? (
                    <tr className="admin_dashboard__row"><td className="admin_dashboard__cell" colSpan={5}>Error loading logs</td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr className="admin_dashboard__row"><td className="admin_dashboard__cell" colSpan={5}>No logs found</td></tr>
                  ) : (
                    filteredItems.map((it) => (
                      <tr key={it.id} className="admin_dashboard__row">
                        <td className="admin_dashboard__cell admin_dashboard__cell--inv">{it.id}</td>
                        <td className="admin_dashboard__cell admin_dashboard__cell--product">{it.product_name}</td>
                        <td className="admin_dashboard__cell admin_dashboard__cell--type">{it.change_type}</td>
                        <td className="admin_dashboard__cell admin_dashboard__cell--qty">{it.quantity_changed}</td>
                        <td className="admin_dashboard__cell admin_dashboard__cell--date">{new Date(it.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin_dashboard__bar_footer">
              <div className="admin_dashboard__bar_meta">Page {invMeta?.page || 1} of {invMeta?.pages || 1}</div>
              <div className="admin_dashboard__bar_pager">
                <button className="admin_dashboard__bar_btn" disabled={invLoading || !(invMeta?.hasPrev)} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <button className="admin_dashboard__bar_btn" disabled={invLoading || !(invMeta?.hasNext)} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

