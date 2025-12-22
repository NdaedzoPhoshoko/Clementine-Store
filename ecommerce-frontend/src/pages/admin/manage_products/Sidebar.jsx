import React from 'react';
import './Sidebar.css';
import useManageProducts from './ManageProductsContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { activeSection } = useManageProducts();
  const navigate = useNavigate();
  const items = [
    { key: 'products', label: 'Products' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'categories', label: 'Categories' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="admin_products__sidebar" aria-label="Primary sidebar">
      <div className="admin_products__brand">Clementine Admin</div>
      <nav className="admin_products__nav" aria-label="Admin navigation">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`admin_products__nav_item ${activeSection === it.key ? 'admin_products__nav_item--active' : ''}`}
            onClick={() => navigate(`/admin/product_management/${it.key}`)}
            aria-current={activeSection === it.key ? 'page' : undefined}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
