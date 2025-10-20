
import { useEffect, useState, useCallback } from 'react';
import './Home.css';
import SponsoredBanner from './sponsored_banner/SponsoredBanner.jsx';
import Products from './products/Products.jsx';
import Categories from './categories/Categories.jsx'
import ErrorModal from '../../components/modals/ErrorModal.jsx';

export default function Home() {
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toFriendlyError = (err) => {
    const raw = typeof err === 'string' ? err : err?.message || '';
    const lower = raw.toLowerCase();
    if (!raw) return 'We ran into a hiccup loading products.';
    if (lower.includes('network') || lower.includes('fetch')) return 'We couldn’t connect to the store. Please check your internet and try again.';
    if (lower.includes('timeout') || lower.includes('timed out')) return 'The request took too long. Please try again.';
    if (lower.includes('not found') || lower.includes('404')) return 'Products are temporarily unavailable. Please try again later.';
    if (lower.includes('unauthorized') || lower.includes('forbidden')) return 'Please sign in to continue.';
    return 'Something went wrong while loading products. Please try again.';
  };

  const handleAddToCart = (product) => {
    console.log('Add to cart:', product);
  };

  const handleCategoryError = useCallback((err) => {
    console.error('[Home] Failed to load categories:', err);
    setErrorMsg(toFriendlyError(err));
    setShowError(true);
  }, []);

  const handleProductsError = useCallback((err) => {
    console.error('[Home] Failed to load new products:', err);
    setErrorMsg(toFriendlyError(err));
    setShowError(true);
  }, []);

  return (
    <div className="home__container">
      {showError && (
        <ErrorModal
          message={errorMsg}
          onClose={() => setShowError(false)}
          durationMs={12000}
        />
      )}
      <SponsoredBanner />
      <Categories onError={handleCategoryError} />
      <Products
        title="New Products"
        onAddToCart={handleAddToCart}
        onError={handleProductsError}
      />
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