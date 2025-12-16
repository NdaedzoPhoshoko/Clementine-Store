import React from 'react';
import Layout from './Layout.jsx';
import Sidebar from './Sidebar.jsx';
import InnerSidebar from './InnerSidebar.jsx';
import ContentArea from './ContentArea.jsx';
import { ManageProductsProvider } from './ManageProductsContext.jsx';

export default function ManageProducts() {
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

