
import './Home.css';
import SponsoredBanner from './sponsored_banner/SponsoredBanner.jsx';
import Products from './products/Products.jsx';

export default function Home() {
  // Temporary demo data; replace with real data when API is wired
  const demoProducts = [
    {
      id: 1,
      image_url: '/images/sponsored/keagan-henman-xPJYL0l5Ii8-unsplash.jpg',
      name: 'Ru Sandal - Choc',
      description: 'Leather sandal with dual buckle straps.',
      price: 1495,
    },
    {
      id: 2,
      image_url: '/images/sponsored/no-revisions-kWVImL5QxJI-unsplash.jpg',
      name: 'Canvas Tote — Natural',
      description: 'Everyday carry-all with reinforced seams.',
      price: 399,
    },
    {
      id: 3,
      image_url: '/images/sponsored/kaboompics_sporty-fashion-photography-blue-sneakers-and-tennis-vibes-40270.jpg',
      name: 'Court Sneaker — Blue',
      description: 'Sporty silhouette with cushioned insole.',
      price: 1199,
    },
    {
      id: 4,
      image_url: '/images/sponsored/xuan-thu-le-2OXNxfTt3kQ-unsplash.jpg',
      name: 'Glow Serum 30ml',
      description: 'Vitamin-rich serum for daily radiance.',
      price: 249,
    },
    {
      id: 5,
      image_url: '/images/sponsored/keagan-henman-xPJYL0l5Ii8-unsplash.jpg',
      name: 'Ru Sandal - Choc',
      description: 'Leather sandal with dual buckle straps.',
      price: 1495,
    },
    {
      id: 6,
      image_url: '/images/sponsored/no-revisions-kWVImL5QxJI-unsplash.jpg',
      name: 'Canvas Tote — Natural',
      description: 'Everyday carry-all with reinforced seams.',
      price: 399,
    },
    {
      id: 7,
      image_url: '/images/sponsored/kaboompics_sporty-fashion-photography-blue-sneakers-and-tennis-vibes-40270.jpg',
      name: 'Court Sneaker — Blue',
      description: 'Sporty silhouette with cushioned insole.',
      price: 1199,
    },
    {
      id: 8,
      image_url: '/images/sponsored/xuan-thu-le-2OXNxfTt3kQ-unsplash.jpg',
      name: 'Glow Serum 30ml',
      description: 'Vitamin-rich serum for daily radiance.',
      price: 249,
    },
    {
      id: 9,
      image_url: '/images/sponsored/keagan-henman-xPJYL0l5Ii8-unsplash.jpg',
      name: 'Ru Sandal - Choc',
      description: 'Leather sandal with dual buckle straps.',
      price: 1495,
    },
    {
      id: 10,
      image_url: '/images/sponsored/no-revisions-kWVImL5QxJI-unsplash.jpg',
      name: 'Canvas Tote — Natural',
      description: 'Everyday carry-all with reinforced seams.',
      price: 399,
    },
    {
      id: 11,
      image_url: '/images/sponsored/kaboompics_sporty-fashion-photography-blue-sneakers-and-tennis-vibes-40270.jpg',
      name: 'Court Sneaker — Blue',
      description: 'Sporty silhouette with cushioned insole.',
      price: 1199,
    },
    {
      id: 12,
      image_url: '/images/sponsored/xuan-thu-le-2OXNxfTt3kQ-unsplash.jpg',
      name: 'Glow Serum 30ml',
      description: 'Vitamin-rich serum for daily radiance.',
      price: 249,
    },
    {
      id: 13,
      image_url: '/images/sponsored/keagan-henman-xPJYL0l5Ii8-unsplash.jpg',
      name: 'Ru Sandal - Choc',
      description: 'Leather sandal with dual buckle straps.',
      price: 1495,
    },
    {
      id: 14,
      image_url: '/images/sponsored/no-revisions-kWVImL5QxJI-unsplash.jpg',
      name: 'Canvas Tote — Natural',
      description: 'Everyday carry-all with reinforced seams.',
      price: 399,
    },
  ];

  const handleAddToCart = (product) => {
    // TODO: wire into cart state/API; currently just logs for demo
    console.log('Add to cart:', product);
  };

  return (
    <div className="home__container">
      <SponsoredBanner />
      <section className="home__company" aria-label="Company information">
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
      
      <Products title="Featured Products" products={demoProducts} onAddToCart={handleAddToCart} />
    </div>
  );
}