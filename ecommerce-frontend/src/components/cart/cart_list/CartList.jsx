import './CartList.css';
import { useEffect, useMemo, useState } from 'react';
import CartListItem from '../cart_list_item/CartListItem.jsx';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CartList({ items = [], meta = {}, loading = false, error = null, refresh, onRequestDelete, deleting = false }) {
  // Local display state to support optimistic removal
  const [displayItems, setDisplayItems] = useState(items);

  useEffect(() => {
    setDisplayItems(items);
  }, [items]);

  // Compute totals from local displayItems to reflect optimistic updates instantly
  const { totalItems, subtotal } = useMemo(() => {
    const total = displayItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const sub = displayItems.reduce((s, it) => s + (toNumber(it.price) * Number(it.quantity || 0)), 0);
    return {
      totalItems: Number.isFinite(Number(meta?.totalItems)) ? Number(meta.totalItems) : total,
      subtotal: formatPrice(Number.isFinite(Number(meta?.subtotal)) ? Number(meta.subtotal) : sub),
    };
  }, [displayItems, meta]);

  if (error) {
    return (
      <div className="cart-list">
        <div className="cart-list__error">
          <p>Failed to load your cart: {String(error)}</p>
          <button className="cart-list__retry" onClick={refresh}>Try again</button>
        </div>
      </div>
    );
  }

  if (loading && (!items || items.length === 0)) {
    return (
      <div className="cart-list">
        <div className="cart-list__items">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="cart-item skeleton">
              <div className="cart-item__media" />
              <div className="cart-item__content">
                <div className="skeleton-line" style={{ width: '60%' }} />
                <div className="skeleton-line" style={{ width: '80%' }} />
                <div className="skeleton-line" style={{ width: '40%' }} />
              </div>
              <div className="cart-item__aside">
                <div className="skeleton-line" style={{ width: '80px' }} />
                <div className="skeleton-line" style={{ width: '60px' }} />
                <div className="skeleton-line" style={{ width: '50px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  const handleRemoveImmediate = (item) => {
    const id = item?.cart_item_id;
    setDisplayItems((prev) => prev.filter((it) => Number(it.cart_item_id) !== Number(id)));
  };

  const handleRestoreItem = (item) => {
    // Re-insert the item if deletion fails (place it back near its original position)
    setDisplayItems((prev) => {
      // Avoid duplicates
      if (prev.some((it) => Number(it.cart_item_id) === Number(item?.cart_item_id))) return prev;
      return [item, ...prev];
    });
  };

  return (
    <div className="cart-list cart-list--interactive">
      <div className="cart-list__meta">
        <span className="cart-list__count">Items: {totalItems}</span>
        <span className="cart-list__subtotal">Subtotal: R{subtotal}</span>
      </div>

      {(!items || items.length === 0) ? (
        <div className="cart-list__empty">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-list__items" role="list" aria-label="Cart items">
          {displayItems.map((it) => (
            <CartListItem
              key={it.cart_item_id}
              item={it}
              refresh={refresh}
              onRemove={handleRemoveImmediate}
              onRestore={handleRestoreItem}
              onRequestDelete={onRequestDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}