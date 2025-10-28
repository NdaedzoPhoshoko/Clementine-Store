import React from 'react';
import './AuthStyles.css';

export default function AuthLayout({ children }) {
  return (
    <section className="auth__layout" aria-label="Authentication">
      <div className="auth__left">
        <div className="auth__card">
          {children}
        </div>
      </div>
      <aside className="auth__right" aria-label="Highlights">
        <div className="auth__illustration">
          <div className="auth__illustration-card">
            <img
              src="/images/imageNoVnXXmDNi0.png"
              alt="Shopping preview"
              className="auth__illustration-img"
              loading="lazy"
              decoding="async"
            />
            <div className="auth__illustration-meta">
              <div className="auth__stars" aria-hidden="true">★★★★★</div>
              <div className="auth__caption">Personalized picks, quick checkout, and easy tracking.</div>
            </div>
            <button className="auth__illustration-btn" type="button" aria-label="Explore">Exquisite</button>
          </div>

          <div className="auth__promo">
            <h3 className="auth__promo-title">Start Shopping Today</h3>
            <p className="auth__promo-desc">Get personalized shopping and customization on Clementine Store. Sign in to unlock recommendations, faster checkout, and order tracking.</p>
            <div className="auth__promo-chips">
              <span className="auth__promo-chip">Secure</span>
              <span className="auth__promo-chip">Fast</span>
              <span className="auth__promo-chip">Reliable</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}