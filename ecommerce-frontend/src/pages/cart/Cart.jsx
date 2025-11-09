import './Cart.css';
import { useState, useEffect } from 'react';
import CartList from '../../components/cart/cart_list/CartList.jsx';
import useFetchCart from '../../hooks/for_cart/useFetchCart.js';
import useDeleteCartItem from '../../hooks/for_cart/useDeleteCartItem.js';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Cart() {
  const { cart, items, meta, loading, error, refresh } = useFetchCart({ enabled: true });
  const { deleteItem, loading: deleting } = useDeleteCartItem();

  // Local visible items to support optimistic removal controlled at the page level
  const [visibleItems, setVisibleItems] = useState(items);
  const [confirmItem, setConfirmItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setVisibleItems(items);
  }, [items]);

  const totalItems = Number(meta?.totalItems ?? items?.length ?? 0);
  const subtotalRaw = meta?.subtotal ?? items.reduce((s, it) => s + (toNumber(it.price) * Number(it.quantity || 0)), 0);
  const subtotal = formatPrice(subtotalRaw);

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

  const onConfirmDelete = async () => {
    if (!confirmItem?.cart_item_id) {
      closeConfirm();
      return;
    }
    const id = confirmItem.cart_item_id;
    const prev = visibleItems;
    // Optimistic removal
    setVisibleItems((list) => list.filter((it) => Number(it.cart_item_id) !== Number(id)));
    try {
      await deleteItem(id);
      await refresh();
      closeConfirm();
    } catch (err) {
      // Restore on failure
      setVisibleItems(prev);
      alert(`Failed to remove item: ${err?.message || err}`);
      closeConfirm();
    }
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
          />
        </section>

        <aside className="cart_details-container" aria-label="Cart details and shipping">
          <div className="details-card">
            <h4 className="details-title">Order Summary</h4>

            <div className="details-row">
              <span className="label">Items</span>
              <span className="value">{totalItems}</span>
            </div>

            <div className="details-row">
              <span className="label">Subtotal</span>
              <span className="value">R{subtotal}</span>
            </div>

            <div className="details-row">
              <span className="label">Shipping</span>
              <span className="value text-muted">Calculated at checkout</span>
            </div>

            <div className="details-row">
              <span className="label">Est. Delivery</span>
              <span className="value">2–5 business days</span>
            </div>

            <div className="details-cta">
              <button className="checkout-btn" disabled={!canCheckout} onClick={onCheckout}>
                Proceed to Checkout
              </button>
              {error && (
                <button className="retry-btn" onClick={refresh}>Retry</button>
              )}
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