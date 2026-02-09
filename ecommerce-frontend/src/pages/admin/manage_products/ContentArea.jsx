import React, { useMemo, Suspense } from 'react';
import './ContentArea.css';
import useManageProducts from './ManageProductsContext.jsx';
const Products = React.lazy(() => import('./view_components/Products/Products.jsx'));
const Edit = React.lazy(() => import('./view_components/Products/Edit/Edit.jsx'));
const New = React.lazy(() => import('./view_components/Products/New/New.jsx'));
const InvStock = React.lazy(() => import('./view_components/Inventory/Stock/Stock.jsx'));
const InvLogs = React.lazy(() => import('./view_components/Inventory/InvLogs/Logs.jsx'));
const CategoryList = React.lazy(() => import('./view_components/Category/Category.jsx'));
const CategoryEdit = React.lazy(() => import('./view_components/Category/Edit/Edit.jsx'));
const CategoryNew = React.lazy(() => import('./view_components/Category/New/New.jsx'));

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
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <Products />
            </Suspense>
          ) : innerAction === 'add' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <New />
            </Suspense>
          ) : innerAction === 'edit' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <Edit productId={currentProductId} />
            </Suspense>
          ) : (
            <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
          )
        ) : activeSection === 'inventory' ? (
          innerAction === 'adjust' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <InvStock />
            </Suspense>
          ) : innerAction === 'logs' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <InvLogs />
            </Suspense>
          ) : (
            <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
          )
        ) : activeSection === 'categories' ? (
          (innerAction || 'all') === 'all' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <CategoryList />
            </Suspense>
          ) : innerAction === 'add' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <CategoryNew />
            </Suspense>
          ) : innerAction === 'edit' ? (
            <Suspense fallback={<div className="admin_products__empty_state"></div>}>
              <CategoryEdit productId={currentProductId} />
            </Suspense>
          ) : (
            <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
          )
        ) : (
          <div className="admin_products__empty_state">No {activeSection} yet · {status} · {stock}</div>
        )}
      </div>
    </section>
  );
}
