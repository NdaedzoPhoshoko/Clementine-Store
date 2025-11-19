import React, { useMemo, useState } from 'react';
import './ViewAccount.css';
import AccountSideBar from './AccountSideBar.jsx';
import useAuthLogOut from '../../hooks/use_auth/useAuthLogOut.js';
import { useCart } from '../../hooks/for_cart/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import useFetchMyOrders from '../../hooks/useFetchMyOrders.js';
import EditOrderInfo from './EditOrderInfo.jsx';

export default function ViewAccount() {
  const [active, setActive] = useState('orders');
  const { logout, loading: logoutLoading } = useAuthLogOut();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { items: orders, loading: ordersLoading, error: ordersError, hasMore, loadNextPage, refresh } = useFetchMyOrders({ initialPage: 1, limit: 10, enabled: active === 'orders' });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = useMemo(() => orders.find((o) => Number(o.id) === Number(selectedOrderId)) || null, [orders, selectedOrderId]);
  const [detailMotion, setDetailMotion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const orderStatusSteps = ['Pending', 'Shipped', 'Delivering', 'Delivered'];
  const statusIndex = useMemo(() => {
    const s = String(selectedOrder?.shipping?.delivery_status || selectedOrder?.payment_status || '').toLowerCase();
    if (s.includes('deliver') && s.includes('ed')) return 3;
    if (s.includes('deliver')) return 2;
    if (s.includes('ship')) return 1;
    if (s.includes('pend')) return 0;
    if (s.includes('paid')) return 0;
    return 0;
  }, [selectedOrder?.shipping?.delivery_status, selectedOrder?.payment_status]);
  const getStatusIndex = (order) => {
    const s = String(order?.shipping?.delivery_status || order?.payment_status || '').toLowerCase();
    if (s.includes('deliver') && s.includes('ed')) return 3;
    if (s.includes('deliver')) return 2;
    if (s.includes('ship')) return 1;
    if (s.includes('pend')) return 0;
    if (s.includes('paid')) return 0;
    return 0;
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return String(iso || ''); }
  };
  const fmtPrice = (n) => {
    const v = typeof n === 'number' ? n : parseFloat(n);
    if (!Number.isFinite(v)) return 'R —';
    return `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  React.useEffect(() => {
    if (selectedOrderId) {
      setDetailMotion('entering');
      const t = setTimeout(() => setDetailMotion('open'), 20);
      return () => clearTimeout(t);
    } else {
      setDetailMotion(null);
    }
  }, [selectedOrderId]);

  const closeDetail = () => {
    setDetailMotion('exiting');
    setTimeout(() => {
      setSelectedOrderId(null);
      setDetailMotion(null);
    }, 200);
  };

  const openEditModal = () => { setShowEditModal(true); };

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
                        <div className="my_account-card order-card">
                          <div className="order-card__main">
                            <div className="account-card__title">Order #{o.id}</div>
                            <div className="account-card__text">Placed on {fmtDate(o.created_at)} · {Number(o?.meta?.itemsCount ?? 0)} items · {fmtPrice(o?.meta?.total ?? o.total_price)}</div>
                            {o.shipping && (
                              <div className="account-card__text">Shipping to {o.shipping.city}{o.shipping.province ? `, ${o.shipping.province}` : ''}</div>
                            )}
                            <button type="button" className="account-card__link account-card__link--btn" onClick={() => setSelectedOrderId(o.id)}>View order</button>
                          </div>
                          <div className={`status-timeline order-card__timeline ${selectedOrder ? 'is-hidden' : ''}`} role="list">
                            {orderStatusSteps.map((label, i) => (
                              <React.Fragment key={label}>
                                <div className={`timeline-step ${i < getStatusIndex(o) ? 'timeline-step--done' : ''} ${i === getStatusIndex(o) ? 'timeline-step--current' : ''}`} role="listitem">
                                  <div className="timeline-node" />
                                  <div className="timeline-label">{label}</div>
                                </div>
                                {i < orderStatusSteps.length - 1 && <div className="timeline-connector" />}
                              </React.Fragment>
                            ))}
                          </div>
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
                    <div className={`order-detail ${detailMotion ? `order-detail--${detailMotion}` : ''}`}>
                      <div className="order-detail__header">
                        <div className="order-detail__title">Order #{selectedOrder.id}</div>
                        <button className="order-detail__close" onClick={closeDetail} aria-label="Close order details">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        <div className="order-detail__summary">
                          <div className="kv"><div className="kv__label">Order Number</div><div className="kv__value">{selectedOrder.id}</div></div>
                          <div className="kv"><div className="kv__label">Placed On</div><div className="kv__value">{fmtDate(selectedOrder.created_at)}</div></div>
                          <div className="kv"><div className="kv__label">Current Status</div><div className="kv__value">{selectedOrder.payment_status}</div></div>
                          <div className="kv"><div className="kv__label">Order Total</div><div className="kv__value">{fmtPrice(selectedOrder?.meta?.total ?? selectedOrder.total_price)}</div></div>
                          <div className="kv"><div className="kv__label">Items</div><div className="kv__value">{Number(selectedOrder?.meta?.itemsCount ?? (Array.isArray(selectedOrder.items) ? selectedOrder.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0))}</div></div>
                        </div>
                      </div>
                      {selectedOrder.shipping && (
                        <div className="order-detail__section">
                          <div className="order-detail__section-title">Shipping</div>
                          <div className="kv-grid">
                            <div className="kv"><div className="kv__label">Recipient</div><div className="kv__value">{selectedOrder.shipping.name}</div></div>
                            <div className="kv"><div className="kv__label">Phone</div><div className="kv__value">{selectedOrder.shipping.phone_number || '—'}</div></div>
                            <div className="kv kv--full"><div className="kv__label">Address</div><div className="kv__value">{selectedOrder.shipping.address}</div></div>
                            <div className="kv"><div className="kv__label">City</div><div className="kv__value">{selectedOrder.shipping.city}</div></div>
                            <div className="kv"><div className="kv__label">Province</div><div className="kv__value">{selectedOrder.shipping.province || '—'}</div></div>
                            <div className="kv"><div className="kv__label">Postal Code</div><div className="kv__value">{selectedOrder.shipping.postal_code || '—'}</div></div>
                          </div>
                          <button type="button" className="account-card__link account-card__link--btn" onClick={openEditModal}>Edit shipping</button>
                          <div className="order-detail__section-title">Tracking Order</div>
                          <div className="status-timeline" role="list">
                            {orderStatusSteps.map((label, i) => (
                              <React.Fragment key={label}>
                                <div className={`timeline-step ${i < statusIndex ? 'timeline-step--done' : ''} ${i === statusIndex ? 'timeline-step--current' : ''}`} role="listitem">
                                  <div className="timeline-node" />
                                  <div className="timeline-label">{label}</div>
                                </div>
                                {i < orderStatusSteps.length - 1 && <div className="timeline-connector" />}
                              </React.Fragment>
                            ))}
                          </div>
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
                                <div className="order-item__variants-row">
                                  <div className="variant-chip"><span className="variant-chip__label">Size</span><span className="variant-chip__value">{String(it.size || '').trim() || '—'}</span></div>
                                  <div className="variant-chip"><span className="variant-chip__label">Color</span>{String(it.color_hex || '').trim() && (<span className="variant-chip__swatch" style={{ backgroundColor: it.color_hex }} />)}<span className="variant-chip__value">{String(it.color_hex || '').trim() || '—'}</span></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {selectedOrder && (
            <EditOrderInfo
              open={showEditModal}
              onClose={() => setShowEditModal(false)}
              orderId={selectedOrder.id}
              shipping={selectedOrder.shipping}
              onSuccess={async () => { await refresh(); setShowEditModal(false); }}
            />
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