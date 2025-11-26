import './Cart.css';
import { useState, useEffect, useRef, useMemo } from 'react';
import CartList from '../../components/cart/cart_list/CartList.jsx';
import useFetchCart from '../../hooks/for_cart/useFetchCart.js';
import useDeleteCartItem from '../../hooks/for_cart/useDeleteCartItem.js';
import useUpdateCartItemQuantity from '../../hooks/for_cart/useUpdateCartItemQuantity.js';
import { useCart } from '../../hooks/for_cart/CartContext.jsx';
import { createPortal } from 'react-dom'
import authStorage from '../../hooks/use_auth/authStorage.js'
import { Link, useNavigate } from 'react-router-dom'
import ErrorModal from '../../components/modals/ErrorModal.jsx'
// SuccessModal removed for retrieve action per request
import useRevertCheckout from '../../hooks/for_cart/useRevertCheckout.js'
import useCreateOrder from '../../hooks/for_cart/useCreateOrder.js'
import useLatestOrder from '../../hooks/for_cart/useLatestOrder.js'

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Cart() {
  const isAuthed = authStorage.isAuthenticated();
  const { cart, items, meta, loading, error, refresh } = useFetchCart({ enabled: isAuthed });
  const { deleteItem, loading: deleting } = useDeleteCartItem();
  const { updateQuantity } = useUpdateCartItemQuantity();
  const qtyTimersRef = useRef({});
  const { items: ctxItems, meta: ctxMeta, setItems: setCtxItems, updateItemQuantity, hydrate } = useCart();
  const [errorModalMsg, setErrorModalMsg] = useState('');
  const closeErrorModal = () => setErrorModalMsg('');
  // Success modal state removed for retrieve action
  const { revertCheckout, loading: reverting } = useRevertCheckout();
  const formatUiError = (err, ctx) => {
    if (!err) return '';
    const raw = typeof err === 'string' ? err : (err?.message || 'Unexpected error');
    const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
    if (offline) return `${ctx}: Network is offline — check your connection and refresh the page.`;
    const m = String(raw).toLowerCase();
    if (m.includes('failed to fetch')) return `${ctx}: Network error — please check your connection and refresh the page.`;
    if (m.startsWith('http 5') || m.includes('http 5')) return `${ctx}: Server error — please try again later.`;
    if (m.startsWith('http 4') || m.includes('http 4')) return `${ctx}: Request error — please refresh the page and try again.`;
    if (m.includes('unexpected content-type')) return `${ctx}: Unexpected server response — refresh the page and try again.`;
    if (m.includes('refresh failed') || m.includes('session expired')) return `${ctx}: Session issue — please sign in again.`;
    return `${ctx}: Something went wrong — please refresh the page or try again.`;
  };

  const navigate = useNavigate();
  const { createOrder, loading: creatingOrder } = useCreateOrder();

  // Local visible items to support optimistic removal controlled at the page level
  const [visibleItems, setVisibleItems] = useState(items);
  const [confirmItem, setConfirmItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [numOfItems, setNumOfItems] = useState((items || []).length);

  // Inline styles to keep modal code self-contained in this file
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 10000,
  };
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    padding: '16px',
    width: 'min(84vw, 460px)',
    zIndex: 10001,
  };
  
  // Lock page scroll while modal is open
  useEffect(() => {
    if (showConfirm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [showConfirm]);

  // Hydrate context whenever backend provides fresh data
  useEffect(() => {
    hydrate({ items, meta });
  }, [items, meta, hydrate]);

  useEffect(() => {
    setVisibleItems(ctxItems);
    setNumOfItems((ctxItems || []).length);
  }, [ctxItems]);

  // Derive order summary from visibleItems for immediate updates on quantity changes
  const { itemsCountLocal, subtotalLocal } = useMemo(() => {
    const list = Array.isArray(visibleItems) ? visibleItems : [];
    const totalUnits = list.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const sub = list.reduce((s, it) => s + (toNumber(it.price) * Number(it.quantity || 0)), 0);
    return { itemsCountLocal: totalUnits, subtotalLocal: formatPrice(sub) };
  }, [visibleItems]);

  const estimatedDelivery = useMemo(() => 'Within the next 5-7 business days', []);
  // Read order summary from backend meta
  const itemsCountFromMeta = Number.isFinite(Number(meta?.totalItems)) ? Number(meta.totalItems) : 0;
  const subtotalFromMeta = formatPrice(Number(meta?.subtotal));

  const canCheckout = !loading && !error && (visibleItems?.length || 0) > 0;

  const onCheckout = async () => {
    const list = Array.isArray((ctxItems || [])) ? ctxItems : [];
    try {
      const payload = await createOrder({});
      const nextItems = Array.isArray(payload?.items) ? payload.items : list;
      const orderId = payload?.order?.id;
      const total = payload?.meta?.total;
      navigate('/cart/checkout', { state: { items: nextItems, orderId, total } });
    } catch (err) {
      setErrorModalMsg(formatUiError(err, 'Checkout'));
    }
  };

  const { fetchLatestOrder, loading: loadingLatestOrder } = useLatestOrder();
  const onContinueCheckout = async () => {
    try {
      const latest = await fetchLatestOrder();
      if (!latest) {
        throw new Error('No recent order found');
      }
      const items = Array.isArray(latest.items) ? latest.items.map((it) => ({
        cart_item_id: it.order_item_id,
        product_id: it.product_id,
        name: it.name,
        price: Number(it.price),
        quantity: Number(it.quantity),
        image_url: typeof it.image_url === 'string' ? it.image_url : '',
      })) : [];
      const total = Number(latest?.meta?.total ?? latest?.total_price ?? 0);
      navigate('/cart/checkout', { state: { items, orderId: latest.id, total, shipping: latest.shipping || null } });
    } catch (err) {
      setErrorModalMsg(formatUiError(err, 'Checkout'));
    }
  };

  const onRequestDelete = (item) => {
    setConfirmItem(item);
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setConfirmItem(null);
  };

  const onConfirmDelete = () => {
    if (!confirmItem?.cart_item_id) {
      closeConfirm();
      return;
    }
    const id = confirmItem.cart_item_id;
    const prev = visibleItems;
    // Optimistic removal
    setVisibleItems((list) => list.filter((it) => Number(it.cart_item_id) !== Number(id)));
    setCtxItems((list) => Array.isArray(list) ? list.filter((it) => Number(it.cart_item_id) !== Number(id)) : []);
    // Close modal immediately
    closeConfirm();
    // Perform deletion in background; restore on failure
    (async () => {
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        setVisibleItems(prev);
        setCtxItems(prev);
        setErrorModalMsg(formatUiError(err, 'Cart'));
      }
    })();
  };

  const onCancelCheckout = async () => {
    try {
      await revertCheckout();
      await refresh();
    } catch (err) {
      setErrorModalMsg(formatUiError(err, 'Cart'));
    }
  };

  const scheduleQuantityUpdate = (cartItemId, nextQty) => {
    const id = Number(cartItemId);
    const timers = qtyTimersRef.current || {};
    if (timers[id]) clearTimeout(timers[id]);
    timers[id] = setTimeout(async () => {
      try {
        await updateQuantity(id, Number(nextQty));
        await refresh();
      } catch (err) {
        setErrorModalMsg(formatUiError(err, 'Cart'));
      }
    }, 400);
    qtyTimersRef.current = timers;
  };

  const onQuantityChange = (cartItemId, nextQty) => {
    // Update visibleItems immediately to reflect changes in Order Summary
    setVisibleItems((prev) => prev.map((it) => (
      Number(it.cart_item_id) === Number(cartItemId)
        ? { ...it, quantity: Number(nextQty) }
        : it
    )));
    // Update shared cart context so Navbar counter updates instantly
    updateItemQuantity(cartItemId, nextQty);
    // Back-end update debounced
    scheduleQuantityUpdate(cartItemId, nextQty);
  };

  useEffect(() => {
    if (error) {
      setErrorModalMsg(formatUiError(error, 'Cart'));
    }
  }, [error]);

  return (
    <>
      {/* Error modal for cart-related failures */}
      {Boolean(errorModalMsg) && (
        <ErrorModal message={errorModalMsg} onClose={closeErrorModal} durationMs={10000} />
      )}
      <div className="cart-container">
        <header className="cart-header">
          <h3 className="cart-title">Your Shopping Bag</h3>
        </header>

        {isAuthed && (!loading && !error && (visibleItems?.length ?? 0) === 0) && (
          <div className="checkout-banner" role="status" aria-live="polite">
            <div className="checkout-banner__text">
              You have a checkout in progress. To retrieve your cart items, choose "Cancel Checkout". To finish your order, continue to checkout.
            </div>
            <div className="banner-actions">
              <button className="banner-btn banner-btn--primary" onClick={onContinueCheckout} disabled={loadingLatestOrder}>
                Continue Checkout
              </button>
              <button className="banner-btn" onClick={onCancelCheckout} disabled={reverting}>
                Retrieve Cart Items
              </button>
            </div>
          </div>
        )}

        {/* // Replace logical-AND with ternary so the trailing ':' remains valid */}
        {!isAuthed ? (
          <div className="cart-empty">
            <img
              className="cart-empty__illustration"
              src="/illustrations/Shopping bag-rafiki 1.svg"
              alt="Empty cart"
            />
            <p className="cart-empty__message">
              <Link to="/auth/login" className="cart-empty__login-link">Log in</Link>
              {' '}to fill your shopping bags with amazing finds.
            </p>
          </div>
        ) : (
          <div className="cart-page">
            <section className="cart__list-container">
              {(!loading && !error && (visibleItems?.length ?? 0) === 0) ? (
                <div className="cart-empty-authed">
                  <img
                    className="cart-empty-authed__illustration"
                    src="/illustrations/Shopping bag-rafiki 1.svg"
                    alt="Empty cart"
                  />
                  <p className="cart-empty-authed__message">
                    Your shopping bag is empty — add some clothes to get started.
                  </p>
                </div>
              ) : (
                <CartList
                  items={visibleItems}
                  meta={meta}
                  loading={loading}
                  error={error}
                  refresh={refresh}
                  onRequestDelete={onRequestDelete}
                  deleting={deleting}
                  onQuantityChange={onQuantityChange}
                  onItemsCountChange={(count) => setNumOfItems(Number(count) || 0)}
                />
              )}
            </section>

            <aside className="cart_details-container" aria-label="Cart details and shipping">
              <div className="details-card">
                <h4 className="details-title">Order Summary</h4>

                <div className="details-row">
                  <span className="label">Items</span>
                  <span className="value">{itemsCountLocal}</span>
                </div>

                <div className="details-row">
                  <span className="label">Subtotal</span>
                  <span className="value">R{subtotalLocal}</span>
                </div>

                <div className="details-row">
                  <span className="label">Shipping</span>
                  <span className="value text-muted">Calculated at checkout</span>
                </div>

                <div className="details-row">
                  <span className="label">Est. Delivery</span>
                  <span className="value text-muted">Within the next 5-7 business days</span>
                </div>

                <div className="details-cta">
                  <button className="checkout-btn" disabled={!canCheckout || creatingOrder} onClick={onCheckout}>
                    Checkout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {isAuthed && showConfirm && (
        createPortal(
          <>
            <div className="confirm-overlay" onClick={closeConfirm} style={overlayStyle} />
            <div
              className="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
              style={modalStyle}
            >
              <h4 id="confirm-title" className="confirm-title">Remove item?</h4>
              <p id="confirm-desc" className="confirm-desc">
                Are you sure you want to remove {confirmItem?.name || 'this item'} from your cart?
              </p>
              <div className="confirm-actions">
                <button className="btn btn--ghost" type="button" onClick={closeConfirm}>Cancel</button>
                <button className="btn btn--danger" type="button" onClick={onConfirmDelete} disabled={deleting}>Remove</button>
              </div>
            </div>
          </>,
          document.body
        )
      )}
      {/* Success modal not shown for retrieval */}
     </>
   );
}
