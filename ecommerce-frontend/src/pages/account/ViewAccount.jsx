import React, { useMemo, useState } from 'react';
import './ViewAccount.css';
import AccountSideBar from './AccountSideBar.jsx';
import useAuthLogOut from '../../hooks/use_auth/useAuthLogOut.js';
import { useCart } from '../../hooks/for_cart/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import useFetchMyOrders from '../../hooks/useFetchMyOrders.js';

export default function ViewAccount() {
  const [active, setActive] = useState('orders');
  const { logout, loading: logoutLoading } = useAuthLogOut();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { items: orders, loading: ordersLoading, error: ordersError, hasMore, loadNextPage } = useFetchMyOrders({ initialPage: 1, limit: 10, enabled: active === 'orders' });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = useMemo(() => orders.find((o) => Number(o.id) === Number(selectedOrderId)) || null, [orders, selectedOrderId]);

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return String(iso || ''); }
  };
  const fmtPrice = (n) => {
    const v = typeof n === 'number' ? n : parseFloat(n);
    if (!Number.isFinite(v)) return 'R —';
    return `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
              <div className="my_section-header">
                <div className="section-title">Orders</div>
                <div className="section-subtitle">Track and manage your recent and past orders.</div>
              </div>
              {ordersError && (
                <div className="my_account-card">
                  <div className="account-card__title">Could not load orders</div>
                  <div className="account-card__text">Please refresh or try again later.</div>
                </div>
              )}
              {ordersLoading && orders.length === 0 && (
                <div className="my_account-card">
                  <div className="account-card__title">Loading orders…</div>
                  <div className="account-card__text">Please wait while we fetch your order history.</div>
                </div>
              )}
              {orders.length === 0 && !ordersLoading && !ordersError && (
                <div className="my_account-card">
                  <div className="account-card__title">No Orders Yet</div>
                  <div className="account-card__text">Start by browsing products and placing your first order.</div>
                  <a className="account-card__link" href="/shop-all">
                    Browse products
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }} aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </div>
              )}
              {orders.length > 0 && (
                <div className="orders-layout">
                  <div className="orders-list">
                    {orders.map((o, idx) => (
                      <React.Fragment key={o.id}>
                        <div className="my_account-card">
                          <div className="account-card__title">Order #{o.id}</div>
                          <div className="account-card__text">Placed on {fmtDate(o.created_at)} · {Number(o?.meta?.itemsCount ?? 0)} items · {fmtPrice(o?.meta?.total ?? o.total_price)}</div>
                          {o.shipping && (
                            <div className="account-card__text">Shipping to {o.shipping.city}{o.shipping.province ? `, ${o.shipping.province}` : ''}</div>
                          )}
                          <button className="account-btn account-btn--light" onClick={() => setSelectedOrderId(o.id)}>View order</button>
                        </div>
                        {idx < orders.length - 1 && <div className="orders-divider" />}
                      </React.Fragment>
                    ))}
                    {hasMore && (
                      <div className="my_account-card">
                        <button className="account-btn account-btn--light" onClick={loadNextPage} disabled={ordersLoading}>Load more</button>
                      </div>
                    )}
                  </div>
                  {selectedOrder && (
                    <div className="order-detail">
                      <div className="order-detail__header">
                        <div className="order-detail__title">Order #{selectedOrder.id}</div>
                        <div className="order-detail__meta">Placed on {fmtDate(selectedOrder.created_at)} · {fmtPrice(selectedOrder?.meta?.total ?? selectedOrder.total_price)} · {selectedOrder.payment_status}</div>
                      </div>
                      {selectedOrder.shipping && (
                        <div className="order-detail__section">
                          <div className="order-detail__section-title">Shipping</div>
                          <div className="order-detail__text">{selectedOrder.shipping.name}</div>
                          <div className="order-detail__text">{selectedOrder.shipping.address}</div>
                          <div className="order-detail__text">{selectedOrder.shipping.city}{selectedOrder.shipping.province ? `, ${selectedOrder.shipping.province}` : ''} {selectedOrder.shipping.postal_code || ''}</div>
                          <div className="order-detail__text">{selectedOrder.shipping.phone_number || ''}</div>
                          <div className="order-detail__badge">{selectedOrder.shipping.delivery_status}</div>
                        </div>
                      )}
                      <div className="order-detail__section">
                        <div className="order-detail__section-title">Items</div>
                        <div className="order-items">
                          {(selectedOrder.items || []).map((it) => (
                            <div key={it.order_item_id} className="order-item">
                              <div className="order-item__img-wrap">
                                <img src={it.image_url} alt={it.name} className="order-item__img" loading="lazy" decoding="async" />
                              </div>
                              <div className="order-item__info">
                                <div className="order-item__name">{it.name}</div>
                                <div className="order-item__meta">Qty {Number(it.quantity)} · {fmtPrice(it.price)}</div>
                                <div className="order-item__variants">
                                  <span>Size {String(it.size || '').trim() || '—'}</span>
                                  {String(it.color_hex || '').trim() && (
                                    <span title={it.color_hex} className="order-item__swatch" style={{ backgroundColor: it.color_hex }} />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="order-detail__footer">
                        <button className="account-btn account-btn--light" onClick={() => setSelectedOrderId(null)}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {active === 'addresses' && (
            <div className="account-section">
              <div className="my_section-header">
                <div className="section-title">Shipping Address</div>
                <div className="section-subtitle">This shipping address will be used when you make Clementine Store purchases.</div>
              </div>
              <div className="my_account-card">
                <div className="account-card__title">No Delivery Address Set Up</div>
                <div className="account-card__text">Add a shipping address to speed up checkout and ensure accurate delivery.</div>
                <a className="account-card__link" href="#add-address">Add a shipping address</a>
              </div>
            </div>
          )}
          {active === 'payments' && (
            <div className="account-section">
              <div className="my_section-header">
                <div className="section-title">Payments</div>
                <div className="section-subtitle">Manage saved payment methods and preferences.</div>
              </div>
              <div className="my_account-card">
                <div className="account-card__title">No Payment Method Saved</div>
                <div className="account-card__text">Save a payment method to check out faster and securely.</div>
                <a className="account-card__link" href="#add-payment">Add a payment method</a>
              </div>
            </div>
          )}
          {active === 'faq' && (
            <div className="account-section">
              <div className="my_section-header">
                <div className="section-title">FAQ</div>
                <div className="section-subtitle">Find answers to common questions.</div>
              </div>
              <div className="my_account-card">
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
              <div className="my_section-header">
                <div className="section-title">Support</div>
                <div className="section-subtitle">Get help with orders, shipping, and account issues.</div>
              </div>
              <div className="my_account-card">
                <div className="account-support">
                  <a className="account-btn account-btn--dark" href="/support/contact">Contact Support</a>
                  <a className="account-btn account-btn--light" href="/support/live-chat">Live Chat</a>
                </div>
              </div>
            </div>
          )}
          {active === 'logout' && (
            <div className="account-section">
              <div className="my_section-header">
                <div className="section-title">Logging out</div>
                <div className="section-subtitle">Signing you out</div>
              </div>
              <div className="my_account-card">
                <button className="account-btn account-btn--light" disabled>{logoutLoading ? 'Logging out…' : 'Logging out'}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}