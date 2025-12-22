import React, { useEffect } from 'react';
import Layout from './Layout.jsx';
import Sidebar from './Sidebar.jsx';
import InnerSidebar from './InnerSidebar.jsx';
import ContentArea from './ContentArea.jsx';
import { ManageProductsProvider } from './ManageProductsContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ManageProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname === '/admin/product_management') {
      navigate('/admin/product_management/products', { replace: true });
    }
  }, [location.pathname, navigate]);
  return (
    <div className="admin_products__page">
      <div className="admin_products__panel">
        <ManageProductsProvider>
          <Layout>
            <Sidebar />
            <InnerSidebar />
            <ContentArea />
          </Layout>
        </ManageProductsProvider>
      </div>
    </div>
  );
}

