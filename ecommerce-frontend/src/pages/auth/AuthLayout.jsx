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
        <div className="auth__illustration" role="img" aria-label="Shopping preview">
          <div className="auth__hero">
            <h3 className="auth__hero-title">Start Shopping Today</h3>
            <p className="auth__hero-subtitle">
              Get personalized shopping and customization on Clementine Store. Sign in to unlock recommendations, faster checkout, and order tracking.
            </p>
            <div className="auth__hero-chips">
              <span className="auth__hero-chip">Secure</span>
              <span className="auth__hero-chip">Fast</span>
              <span className="auth__hero-chip">Reliable</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}