import React, { useEffect, useState } from 'react';
import './InnerSidebar.css';
import useManageProducts from './ManageProductsContext.jsx';

export default function InnerSidebar() {
  const { activeSection, query, setQuery, status, setStatus, stock, setStock, stars, setStars, reviewRange, setReviewRange } = useManageProducts();
  const [activeAction, setActiveAction] = useState('all');
  const toggleAction = (key) => setActiveAction((prev) => (prev === key ? '' : key));
  useEffect(() => {
    if (activeSection === 'products') setActiveAction('all');
    else if (activeSection === 'inventory') setActiveAction('logs');
    else if (activeSection === 'categories') setActiveAction('all');
    else if (activeSection === 'reviews') setActiveAction('all');
    else if (activeSection === 'settings') setActiveAction('manage');
    else setActiveAction('');
  }, [activeSection]);
  return (
    <aside className="admin_products__inner_sidebar" aria-label="Secondary sidebar">
      {activeSection === 'products' ? (
        <>
          <div className="admin_products__section_title">Products</div>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All products"
            aria-pressed={activeAction === 'all'}
            onClick={() => toggleAction('all')}
          >
            All Products
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add product"
            aria-pressed={activeAction === 'add'}
            onClick={() => toggleAction('add')}
          >
            Add Product
          </button>
          {activeAction === 'all' ? (
            <>
              <div className="admin_products__divider" aria-hidden="true"></div>
              <div className="admin_products__section_title">Filters</div>
              <input className="admin_products__filter_input" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="admin_products__filter_select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
              <select className="admin_products__filter_select" aria-label="Filter by stock" value={stock} onChange={(e) => setStock(e.target.value)}>
                <option>All Stock</option>
                <option>In Stock</option>
                <option>Out of Stock</option>
              </select>
            </>
          ) : null}
        </>
      ) : activeSection === 'categories' ? (
        <>
          <div className="admin_products__section_title">Categories</div>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All categories"
            aria-pressed={activeAction === 'all'}
            onClick={() => toggleAction('all')}
          >
            All Categories
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add categories"
            aria-pressed={activeAction === 'add'}
            onClick={() => toggleAction('add')}
          >
            Add Categories
          </button>
          {activeAction === 'all' ? (
            <>
              <div className="admin_products__divider" aria-hidden="true"></div>
              <div className="admin_products__section_title">Filters</div>
              <input className="admin_products__filter_input" placeholder="Search categories" aria-label="Search categories" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="admin_products__filter_select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
              <select className="admin_products__filter_select" aria-label="Filter by stock" value={stock} onChange={(e) => setStock(e.target.value)}>
                <option>All Stock</option>
                <option>In Stock</option>
                <option>Out of Stock</option>
              </select>
            </>
          ) : null}
        </>
      ) : activeSection === 'inventory' ? (
        <>
          <div className="admin_products__section_title">Inventory</div>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'logs' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Inventory logs"
            aria-pressed={activeAction === 'logs'}
            onClick={() => toggleAction('logs')}
          >
            Logs
          </button>
          <div className="admin_products__divider" aria-hidden="true"></div>
          <div className="admin_products__section_title">Filters</div>
          <input className="admin_products__filter_input" placeholder="Search records" aria-label="Search inventory records" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="admin_products__filter_select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
          <select className="admin_products__filter_select" aria-label="Filter by stock" value={stock} onChange={(e) => setStock(e.target.value)}>
            <option>All Stock</option>
            <option>In Stock</option>
            <option>Out of Stock</option>
          </select>
        </>
      ) : activeSection === 'reviews' ? (
        <>
          <div className="admin_products__section_title">Reviews</div>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All reviews"
            aria-pressed={activeAction === 'all'}
            onClick={() => toggleAction('all')}
          >
            All Reviews
          </button>
          {activeAction === 'all' ? (
            <>
              <div className="admin_products__divider" aria-hidden="true"></div>
              <div className="admin_products__section_title">Filters</div>
              <input className="admin_products__filter_input" placeholder="Search reviews" aria-label="Search reviews" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="admin_products__filter_select" aria-label="Filter by stars" value={stars} onChange={(e) => setStars(e.target.value)}>
                <option>All Stars</option>
                <option>1 Stars</option>
                <option>2 Stars</option>
                <option>3 Stars</option>
                <option>4 Stars</option>
                <option>5 Stars</option>
              </select>
              <select className="admin_products__filter_select" aria-label="Filter by review count" value={reviewRange} onChange={(e) => setReviewRange(e.target.value)}>
                <option>All Counts</option>
                <option>0–50 Reviews</option>
                <option>51–100 Reviews</option>
                <option>101–150 Reviews</option>
                <option>151+ Reviews</option>
              </select>
            </>
          ) : null}
        </>
      ) : activeSection === 'settings' ? (
        <>
          <div className="admin_products__section_title">Settings</div>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'manage' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Manage admins"
            aria-pressed={activeAction === 'manage'}
            onClick={() => toggleAction('manage')}
          >
            Manage Admins
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${activeAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add admins"
            aria-pressed={activeAction === 'add'}
            onClick={() => toggleAction('add')}
          >
            Add Admins
          </button>
        </>
      ) : (
        <>
          <div className="admin_products__section_title">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</div>
        </>
      )}
    </aside>
  );
}
