import React, { useEffect } from 'react';
import './InnerSidebar.css';
import useManageProducts from './ManageProductsContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function InnerSidebar() {
  const { activeSection, innerAction, query, setQuery, status, setStatus, stock, setStock, stars, setStars, reviewRange, setReviewRange } = useManageProducts();
  const navigate = useNavigate();
  useEffect(() => {}, [activeSection]);
  return (
    <aside className="admin_products__inner_sidebar" aria-label="Secondary sidebar">
      {activeSection === 'products' ? (
        <>
          <div className="admin_products__section_title">Products</div>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All products"
            aria-pressed={innerAction === 'all'}
            onClick={() => navigate('/admin/product_management/products')}
          >
            All Products
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add product"
            aria-pressed={innerAction === 'add'}
            onClick={() => navigate('/admin/product_management/products/add')}
          >
            Add Product
          </button>
          {innerAction === 'all' ? (
            <>
              <div className="admin_products__divider" aria-hidden="true"></div>
              <div className="admin_products__section_title">Filters</div>
              <input className="admin_products__filter_input" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
              
            </>
          ) : null}
        </>
      ) : activeSection === 'categories' ? (
        <>
          <div className="admin_products__section_title">Categories</div>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All categories"
            aria-pressed={innerAction === 'all'}
            onClick={() => navigate('/admin/product_management/categories')}
          >
            All Categories
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add categories"
            aria-pressed={innerAction === 'add'}
            onClick={() => navigate('/admin/product_management/categories/add')}
          >
            Add Categories
          </button>
          {innerAction === 'all' ? (
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
            className={`admin_products__action_btn ${innerAction === 'adjust' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Adjust stock"
            aria-pressed={innerAction === 'adjust'}
            onClick={() => navigate('/admin/product_management/inventory/adjust')}
          >
            Adjust Stock
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'logs' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Inventory logs"
            aria-pressed={innerAction === 'logs'}
            onClick={() => navigate('/admin/product_management/inventory/logs')}
          >
            Logs
          </button>
          <div className="admin_products__divider" aria-hidden="true"></div>
          <div className="admin_products__section_title">Filters</div>
          {innerAction === 'adjust' ? (
            <>
              <input className="admin_products__filter_input" placeholder="Search products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
            </>
          ) : innerAction === 'logs' ? (
            <>
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
          ) : null}
        </>
      ) : activeSection === 'reviews' ? (
        <>
          <div className="admin_products__section_title">Reviews</div>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'all' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="All reviews"
            aria-pressed={innerAction === 'all'}
            onClick={() => navigate('/admin/product_management/reviews')}
          >
            All Reviews
          </button>
          {innerAction === 'all' ? (
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
            className={`admin_products__action_btn ${innerAction === 'manage' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Manage admins"
            aria-pressed={innerAction === 'manage'}
            onClick={() => navigate('/admin/product_management/settings/manage')}
          >
            Manage Admins
          </button>
          <button
            type="button"
            className={`admin_products__action_btn ${innerAction === 'add' ? 'admin_products__action_btn--active' : ''}`}
            aria-label="Add admins"
            aria-pressed={innerAction === 'add'}
            onClick={() => navigate('/admin/product_management/settings/add')}
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
