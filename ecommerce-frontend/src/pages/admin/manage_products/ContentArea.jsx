import React, { useMemo, Suspense } from 'react';
import './ContentArea.css';
import useManageProducts from './ManageProductsContext.jsx';
const Products = React.lazy(() => import('./view_components/Products/Products.jsx'));
const Edit = React.lazy(() => import('./view_components/Products/Edit/Edit.jsx'));

export default function ContentArea() {
  const { activeSection, status, stock, innerAction, currentProductId } = useManageProducts();
  const hint = useMemo(() => {
    const ia = innerAction || 'all';
    if (activeSection === 'products') {
      if (ia === 'add') return 'Add a new product with details, pricing, inventory and media.';
      return 'View and filter all products using the sidebar filters.';
    }
    if (activeSection === 'inventory') {
      return 'Review inventory change logs with search and filters.';
    }
    if (activeSection === 'categories') {
      if (ia === 'add') return 'Create a new category and define its hierarchy.';
      return 'Browse all categories and refine using filters.';
    }
    if (activeSection === 'reviews') {
      return 'Analyze reviews; filter by stars and review count.';
    }
    if (activeSection === 'settings') {
      if (ia === 'add') return 'Add a new admin with name, email and role.';
      return 'Manage existing admins, roles and status.';
    }
    return 'Select an item from the sidebar to get started.';
  }, [activeSection, innerAction]);
  return (
    <section className="admin_products__content" aria-label="Content area">
      <div className="admin_products__content_header">
        <h1 className="admin_products__title">{activeSection === 'products' ? 'Product Management' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
        <div className="admin_products__content_actions">{hint}</div>
      </div>
      <div className="admin_products__content_body">
        {activeSection === 'products' ? (
          (innerAction || 'all') === 'all' ? (
            <Suspense fallback={<div className="admin_products__empty_state">Loading products…</div>}>
              <Products />
            </Suspense>
          ) : (innerAction === 'edit' ? (
            <Suspense fallback={<div className="admin_products__empty_state">Loading editor…</div>}>
              <Edit productId={currentProductId} />
            </Suspense>
          ) : (
            <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
          ))
        ) : (
          <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
        )}
      </div>
    </section>
  );
}
