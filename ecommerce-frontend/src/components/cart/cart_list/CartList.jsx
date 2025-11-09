import './CartList.css';
import CartListItem from '../cart_list_item/CartListItem.jsx';
import useFetchCart from '../../../hooks/for_cart/useFetchCart.js';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CartList() {
  const { cart, items, meta, loading, error, refresh } = useFetchCart({ enabled: true });

  if (error) {
    return (
      <div className="cart-list">
        <div className="cart-list__header">
          <h3 className="cart-list__title">Your Cart</h3>
        </div>
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
        <div className="cart-list__header">
          <h3 className="cart-list__title">Your Cart</h3>
        </div>
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

  const totalItems = Number(meta?.totalItems ?? items?.length ?? 0);
  const subtotal = formatPrice(meta?.subtotal ?? items.reduce((s, it) => s + (toNumber(it.price) * Number(it.quantity || 0)), 0));

  return (
    <div className="cart-list">
      <div className="cart-list__header">
        <h3 className="cart-list__title">Your Cart</h3>
        <div className="cart-list__meta">
          <span className="cart-list__count">Items: {totalItems}</span>
          <span className="cart-list__subtotal">Subtotal: R{subtotal}</span>
        </div>
      </div>

      {(!items || items.length === 0) ? (
        <div className="cart-list__empty">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-list__items" role="list" aria-label="Cart items">
          {items.map((it) => (
            <CartListItem key={it.cart_item_id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}