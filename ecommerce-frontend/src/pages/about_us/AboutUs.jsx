import './AboutUs.css';

export default function AboutUs() {
  return (
    <main className="about-page" aria-labelledby="about-heading">
      {/* Feature bar */}
      <section className="features" aria-label="Store highlights">
        <div className="features-grid">
          <FeatureCard
            icon={<ShieldCheckIcon />}
            title="Certified"
            text="Available certificates of authenticity"
          />
          <FeatureCard
            icon={<ShieldLockIcon />}
            title="Secure"
            text="Certified marketplace since 2024"
          />
          <FeatureCard
            icon={<TruckIcon />}
            title="Shipping"
            text="Free, fast, and reliable worldwide"
          />
          <FeatureCard
            icon={<BadgeInfoIcon />}
            title="Transparent"
            text="Hassle-free return policy"
          />
        </div>
      </section>

      {/* Mission section */}
      <section className="mission" aria-labelledby="mission-heading">
        <div className="mission-grid">
          <div className="mission-content">
            <h2 id="mission-heading" className="mission-title">Our Mission</h2>
            <p className="mission-text">
              Our mission is to deliver modern, wearable fashion that makes you feel
              confident every day. We obsess over fit, durability, and responsible
              sourcing—bringing you pieces that look great and last. With fast
              shipping and clear communication, we make online clothes shopping simple
              and enjoyable.
            </p>
          </div>
          <div className="mission-media">
            <img
              src="/images/about_us/hoodies(1).png"
              alt="Hoodies, reflecting our designs"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
      {/* Divider between Mission and Vision */}
      <hr className="about-divider" aria-hidden="true" />
      {/* Vision section */}
      <section className="vision" aria-labelledby="vision-heading">
        <div className="vision-grid">
          <div className="vision-media">
            <img
              src="/images/about_us/view-hawaiian-shirt-with-clothing-rack.png"
              alt="Rack of clothes, showcasing summer clothes"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="vision-content">
            <h2 id="vision-heading" className="vision-title">Our Vision</h2>
            <p className="vision-text">
              At {`Clementine Store`}, we make shopping for clothes effortless and inspiring.
              From everyday essentials to standout looks, our collections are designed for
              real life: great fits, quality fabrics, and styles that move with you. We
              believe in transparent pricing, reliable shipping, and a smooth, hassle-free
              experience—from browsing to checkout to returns.
            </p>
          </div>
        </div>
      </section>

      {/* Divider under Vision */}
      <hr className="about-divider" aria-hidden="true" />

      {/* Our Story section */}
      <section className="story" aria-labelledby="story-heading">
        <h2 id="story-heading" className="story-title">Our Story</h2>
        <p className="story-text">
          Clementine Store began as a weekend ritual—early morning walks through local markets,
          talking with small makers, and collecting pieces that felt both practical and joyful.
          We loved how the right garment could brighten a day and how good materials could turn
          everyday wear into something you looked forward to. What started as a shared Pinterest
          board and pop-up stalls slowly evolved into an online shop where we could curate those
          same feelings for more people.
        </p>
        <p className="story-text">
          The name “Clementine” captures the spirit we want to bring to your wardrobe: warm,
          playful, and refreshingly simple. It reminds us of long afternoons, friendly conversations,
          and details that make you smile. From the beginning, we focused on fit, comfort, and
          durability—pieces you reach for without thinking, because they always work. We collaborate
          with partners who share our standards and values, prioritizing quality materials and
          responsible production.
        </p>
        <p className="story-text">
          As we grew, we listened closely. Customers told us where seams rubbed, which fabrics
          felt better in heat, and what made a hoodie perfect for travel. That feedback shapes our
          collections today. We refine patterns, adjust lengths, and source better zippers and
          linings. Every release is a little smarter and a little more considerate than the last.
          It’s our way of honoring the everyday moments you live in these clothes.
        </p>
        <p className="story-text">
          Clementine Store is still a small team, and we like it that way. It keeps us close to the
          craft, the community, and the promise we made at the start: make shopping for clothes
          effortless and enjoyable. Transparent pricing, reliable shipping, and easy returns are part
          of that promise. We hope you feel the care that went into each piece—and that you find
          something here that brightens your day.
        </p>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card" role="article" aria-label={title}>
      <div className="feature-icon" aria-hidden="true">{icon}</div>
      <div className="feature-content">
        <h3 className="feature-title">{title}</h3>
        <p className="feature-text">{text}</p>
      </div>
    </div>
  );
}

/* Inline SVG icons styled via currentColor to use global colors */
function ShieldCheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8.5 12l2.5 2.5L15.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShieldLockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="9" y="10" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10V8.75A2.75 2.75 0 0113.25 6h0A2.75 2.75 0 0116 8.75V10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7h10v8H3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M13 9h4l3 3v3h-7V9z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="6.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function BadgeInfoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 8.5a.75.75 0 100-1.5.75.75 0 000 1.5z" fill="currentColor"/>
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}