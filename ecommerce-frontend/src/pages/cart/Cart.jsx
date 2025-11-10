import './Cart.css';
import { useState, useEffect, useRef, useMemo } from 'react';
import CartList from '../../components/cart/cart_list/CartList.jsx';
import useFetchCart from '../../hooks/for_cart/useFetchCart.js';
import useDeleteCartItem from '../../hooks/for_cart/useDeleteCartItem.js';
import useUpdateCartItemQuantity from '../../hooks/for_cart/useUpdateCartItemQuantity.js';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Cart() {
  const { cart, items, meta, loading, error, refresh } = useFetchCart({ enabled: true });
  const { deleteItem, loading: deleting } = useDeleteCartItem();
  const { updateQuantity } = useUpdateCartItemQuantity();
  const qtyTimersRef = useRef({});

  // Local visible items to support optimistic removal controlled at the page level
  const [visibleItems, setVisibleItems] = useState(items);
  const [confirmItem, setConfirmItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [numOfItems, setNumOfItems] = useState((items || []).length);

  useEffect(() => {
    setVisibleItems(items);
    setNumOfItems((items || []).length);
  }, [items]);

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

  const onCheckout = () => {
    // Placeholder: navigate to checkout or trigger flow
    // e.g., useNavigate('/checkout') if router is set up
    alert('Proceeding to checkout...');
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
    // Close modal immediately
    closeConfirm();
    // Perform deletion in background; restore on failure
    (async () => {
      try {
        await deleteItem(id);
        await refresh();
      } catch (err) {
        setVisibleItems(prev);
        alert(`Failed to remove item: ${err?.message || err}`);
      }
    })();
  };

  useEffect(() => {
    return () => {
      Object.values(qtyTimersRef.current || {}).forEach((t) => clearTimeout(t));
      qtyTimersRef.current = {};
    };
  }, []);

  const scheduleQuantityUpdate = (cartItemId, nextQty) => {
    const key = String(cartItemId);
    const timers = qtyTimersRef.current;
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(async () => {
      try {
        await updateQuantity(cartItemId, Number(nextQty));
        await refresh();
      } catch (err) {
        console.warn('[Cart] Failed to update quantity:', err);
      } finally {
        delete timers[key];
      }
    }, 500);
  };

  const onQuantityChange = (cartItemId, nextQty) => {
    // Update visibleItems immediately to reflect changes in Order Summary
    setVisibleItems((prev) => prev.map((it) => (
      Number(it.cart_item_id) === Number(cartItemId)
        ? { ...it, quantity: Number(nextQty) }
        : it
    )));
    scheduleQuantityUpdate(cartItemId, nextQty);
  };

  return (
    <div className="cart-container">
      <header className="cart-header">
        <h3 className="cart-title">Your Shopping Bag</h3>
      </header>

      <div className="cart-page">
        <section className="cart__list-container">
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
              <span className="value text-muted">{estimatedDelivery}</span>
            </div>
            <div className="details-cta">
              <button
                type="button"
                className="checkout-btn"
                onClick={onCheckout}
                disabled={!canCheckout}
                aria-label="Proceed to checkout"
              >
                Checkout
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" role="presentation" onClick={closeConfirm}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 className="confirm-title font-heading" id="confirm-title">Remove item?</h3>
            <p className="confirm-desc" id="confirm-desc">
              "{confirmItem?.name}" will be removed from your cart. This can’t be undone.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn btn--ghost" onClick={closeConfirm}>Cancel</button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={onConfirmDelete}
                disabled={deleting}
                autoFocus
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}