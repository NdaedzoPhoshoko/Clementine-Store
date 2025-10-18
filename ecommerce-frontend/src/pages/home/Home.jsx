
import { useEffect } from 'react';
import './Home.css';
import SponsoredBanner from './sponsored_banner/SponsoredBanner.jsx';
import Products from './products/Products.jsx';
import useFetchNewProducts from '../../hooks/useFetchNewProducts.js';

export default function Home() {
  const { products: latestProducts, loading: latestLoading, error: latestError } = useFetchNewProducts();
  // Log only errors (do not show errors in the UI)
  useEffect(() => {
    if (latestError) {
      console.error('[Home] Failed to load new products:', latestError);
    }
  }, [latestError]);

  const handleAddToCart = (product) => {
    // TODO: wire into cart state/API; currently just logs for demo
    console.log('Add to cart:', product);
  };
  // Build grid products from live data when available; fall back to demo
  const coerceProduct = (p) => ({
    id: p.id,
    image_url: typeof p.image_url === 'string' ? p.image_url : '',
    name: typeof p.name === 'string' ? p.name : String(p.name ?? ''),
    description: typeof p.description === 'string' ? p.description : String(p.description ?? ''),
    price:
      typeof p.price === 'number'
        ? p.price
        : parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0,
  });
  const sourceProducts = Array.isArray(latestProducts) ? latestProducts : [];
  const gridProducts = sourceProducts.map(coerceProduct);
  return (
    <div className="home__container">
      <SponsoredBanner />
      <Products title="New Products" products={gridProducts} onAddToCart={handleAddToCart} />
      <section className="home__company" aria-label="Company information" /*style={{display:'none'}*/>
        <div className="home__company-inner">
          <h2 className="home__company-title">About Clementine</h2>
          <div className="home__company-grid">
            <article className="company-card" aria-label="Mission">
              <h3>Mission</h3>
              <p>Delight shoppers with curated products, fair pricing, and a seamless experience from discovery to delivery.</p>
            </article>
            <article className="company-card" aria-label="Vision">
              <h3>Vision</h3>
              <p>Be the most trusted destination for modern essentials—where quality, sustainability, and style meet.</p>
            </article>
            <article className="company-card" aria-label="Values">
              <h3>Values</h3>
              <ul>
                <li>Customer-first service</li>
                <li>Responsibly sourced products</li>
                <li>Transparent, fair pricing</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}