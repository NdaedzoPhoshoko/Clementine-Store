
import './App.css'
import Navbar from './components/nabar/Navbar'
import ScrollToTop from './components/ScrollToTop'
import Footer from './components/footer/Footer'
import Home from './pages/home/Home'
import ViewAccount from './pages/account/ViewAccount.jsx'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import ShopAll from './pages/shopping/ShopAll'
import Breadcrumbs from './components/breadcrumbs/Breadcrumbs'
import ProductPage from './pages/product_page/ProductPage'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import SessionExpiryHandler from './components/auth/SessionExpiryHandler'
import RequireAdmin from './components/auth/RequireAdmin.jsx'
import Cart from './pages/cart/Cart'
import { CartProvider } from './hooks/for_cart/CartContext.jsx'
import AboutUs from './pages/about_us/AboutUs.jsx'
import Checkout from './pages/checkout/Checkout.jsx'
import { useEffect } from 'react'
import useAuthRefresh from './hooks/use_auth/useAuthRefresh.js'
import Support from './pages/support/Support.jsx'

import AdminDashboard from './pages/admin/dashboard/AdminDashboard.jsx'
import Settings from './pages/admin/settings/Settings.jsx'
import ManageProducts from './pages/admin/manage_products/ManageProducts.jsx'

function AppShell() {
  const location = useLocation();
  const isSupport = location.pathname.startsWith('/support');
  return (
    <div className={`app-shell ${isSupport ? 'support-theme' : ''}`}>
      <Navbar />
      <ScrollToTop />
      <main className="app-content">
        <Breadcrumbs />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/shop-all" element={<ShopAll />} />
          <Route path="/support" element={<Support />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/cart/checkout" element={<Checkout />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/account" element={<ViewAccount />} />

          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
          <Route path="/admin/product_management" element={<RequireAdmin><ManageProducts /></RequireAdmin>} />
          
          
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <SessionExpiryHandler />
    </div>
  );
}

function App() {
  const { refresh } = useAuthRefresh();
  useEffect(() => {
    try { refresh({ silent: true }); } catch (_) {}
  }, [refresh]);
  return (
    <CartProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App
