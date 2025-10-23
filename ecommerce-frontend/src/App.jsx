
import './App.css'
import Navbar from './components/nabar/Navbar'
import Footer from './components/footer/Footer'
import Home from './pages/home/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ShopAll from './pages/shopping/ShopAll'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-content">
          {/* Routing scaffold; add real pages later */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop-all" element={<ShopAll />} />
            {/* Placeholder route for product pages until you add the page */}
            <Route path="/product/:id" element={<Home />} />
            {/* Fallback to home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
