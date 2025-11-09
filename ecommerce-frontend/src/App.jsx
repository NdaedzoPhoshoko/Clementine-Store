
import './App.css'
import Navbar from './components/nabar/Navbar'
import Footer from './components/footer/Footer'
import Home from './pages/home/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ShopAll from './pages/shopping/ShopAll'
import Breadcrumbs from './components/breadcrumbs/Breadcrumbs'
import ProductPage from './pages/product_page/ProductPage'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import SessionExpiryHandler from './components/auth/SessionExpiryHandler'
import Cart from './pages/cart/Cart'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-content">
         <Breadcrumbs />
          {/* Routing scaffold; add real pages later */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop-all" element={<ShopAll />} />
            {/* Product details route */}
            <Route path="/product/:id" element={<ProductPage />} />
            {/* Cart page */}
            <Route path="/cart" element={<Cart />} />
            {/* Auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            {/* Fallback to home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
        <SessionExpiryHandler />
      </div>
    </BrowserRouter>
  )
}

export default App
