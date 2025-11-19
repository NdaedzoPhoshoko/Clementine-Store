import React, { useState } from 'react';
import './ViewAccount.css';
import AccountSideBar from './AccountSideBar.jsx';
import useAuthLogOut from '../../hooks/use_auth/useAuthLogOut.js';
import { useCart } from '../../hooks/for_cart/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ViewAccount() {
  const [active, setActive] = useState('orders');
  const { logout, loading: logoutLoading } = useAuthLogOut();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleSelect = async (key) => {
    if (key === 'logout') {
      try { await logout(); } catch {}
      try { clearCart(); } catch {}
      navigate('/');
      return;
    }
    setActive(key);
  };

  return (
    <div className="account-page">
      <div className="account-layout">
        <AccountSideBar active={active} onSelect={handleSelect} />
        <section className="account-content" aria-live="polite">
          {active === 'orders' && (
            <div className="account-section">
              <h1>My Orders</h1>
              <p className="text-muted">Track and manage your recent and past orders.</p>
              <div className="account-card">
                <div className="account-card__empty">No orders yet</div>
              </div>
            </div>
          )}
          {active === 'addresses' && (
            <div className="account-section">
              <h1>My Addresses</h1>
              <p className="text-muted">Save shipping and billing addresses to checkout faster.</p>
              <div className="account-card">
                <div className="account-card__empty">No addresses added</div>
              </div>
            </div>
          )}
          {active === 'payments' && (
            <div className="account-section">
              <h1>Payments</h1>
              <p className="text-muted">Manage saved payment methods and preferences.</p>
              <div className="account-card">
                <div className="account-card__empty">No payment methods saved</div>
              </div>
            </div>
          )}
          {active === 'faq' && (
            <div className="account-section">
              <h1>FAQ</h1>
              <p className="text-muted">Find answers to common questions.</p>
              <div className="account-card">
                <ul className="account-list">
                  <li>How do I track my order?</li>
                  <li>What is the return policy?</li>
                  <li>How do I change my password?</li>
                </ul>
              </div>
            </div>
          )}
          {active === 'support' && (
            <div className="account-section">
              <h1>Support</h1>
              <p className="text-muted">Get help with orders, shipping, and account issues.</p>
              <div className="account-card">
                <div className="account-support">
                  <a className="account-btn account-btn--dark" href="/support/contact">Contact Support</a>
                  <a className="account-btn account-btn--light" href="/support/live-chat">Live Chat</a>
                </div>
              </div>
            </div>
          )}
          {active === 'logout' && (
            <div className="account-section">
              <h1>Logging out</h1>
              <p className="text-muted">Signing you out</p>
              <div className="account-card">
                <button className="account-btn account-btn--light" disabled>{logoutLoading ? 'Logging out…' : 'Logging out'}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}