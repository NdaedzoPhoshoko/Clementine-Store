import './CartListItem.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useUpdateCartItemQuantity from '../../../hooks/for_cart/useUpdateCartItemQuantity.js';

const toNumber = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v));
const formatPrice = (v) => {
  const n = toNumber(v);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const isHexColor = (hex) => typeof hex === 'string' && /^#?[0-9A-Fa-f]{3,8}$/.test(hex);

export default function CartListItem({ item = {}, onRemove, onRestore, refresh, onRequestDelete, deleting = false }) {
  const navigate = useNavigate();
  const { updateQuantity, loading: updating } = useUpdateCartItemQuantity();
  const {
    image_url,
    name,
    description,
    price,
    quantity,
    stock,
    size,
    color_hex,
    product_id,
    productId,
    id,
    product,
  } = item;

  const colorValue = isHexColor(color_hex) ? (color_hex.startsWith('#') ? color_hex : `#${color_hex}`) : '';
  const inStock = Number(stock) > 0;
  const productIdResolved = product_id ?? productId ?? id ?? product?.id;
  const [qty, setQty] = useState(Number(quantity || 0));

  useEffect(() => {
    setQty(Number(quantity || 0));
  }, [quantity]);

  const handleView = () => {
    if (productIdResolved) {
      navigate(`/product/${productIdResolved}`);
    }
  };

  const onKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && productIdResolved) {
      e.preventDefault();
      handleView();
    }
  };

  const handleDecrease = async (e) => {
    e.stopPropagation();
    const min = 1;
    const next = Math.max(min, qty - 1);
    if (next === qty) return;
    const prev = qty;
    setQty(next);
    try {
      await updateQuantity(item.cart_item_id, next);
      await refresh?.();
    } catch (err) {
      setQty(prev);
      alert(`Failed to update quantity: ${err?.message || err}`);
    }
  };

  const handleIncrease = async (e) => {
    e.stopPropagation();
    const max = Number.isFinite(Number(stock)) && Number(stock) > 0 ? Number(stock) : undefined;
    const next = max ? Math.min(max, qty + 1) : qty + 1;
    if (next === qty) return;
    const prev = qty;
    setQty(next);
    try {
      await updateQuantity(item.cart_item_id, next);
      await refresh?.();
    } catch (err) {
      setQty(prev);
      alert(`Failed to update quantity: ${err?.message || err}`);
    }
  };

  const requestDelete = (e) => {
    e.stopPropagation();
    if (typeof onRequestDelete === 'function') onRequestDelete(item);
  };

  return (
    <div
      className="cart-item cart-item--clickable"
      role="listitem"
      aria-label={String(name || 'Item')}
      tabIndex={0}
      onClick={handleView}
      onKeyDown={onKeyDown}
      title={productIdResolved ? 'View product details' : ''}
    > 
      <div className="cart-item__media">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img
          src={typeof image_url === 'string' ? image_url.trim().replace(/^`|`$/g, '') : ''}
          alt={String(name || 'Product image')}
          className="cart-item__image"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="cart-item__content">
        <div className="cart-item__title" title={name || ''}>{name || ''}</div>
        <div className="cart-item__desc" title={description || ''}>{description || ''}</div>

        <div className="cart-item__variants">
          <span className="variant variant--size" aria-label="Selected size">Size: {size || '—'}</span>
          <span className="variant variant--color" aria-label="Selected color">
            Color:
            <span
              className="color-swatch"
              style={{ backgroundColor: colorValue || 'transparent', borderColor: colorValue ? 'transparent' : 'var(--color-border)' }}
              aria-hidden="true"
            />
            <span className="color-code">{colorValue || '—'}</span>
          </span>
        </div>
      </div>

      <div className="cart-item__aside">
        <div className="price">R{formatPrice(price)}</div>
        <div className={inStock ? 'stock stock--in' : 'stock stock--out'}>
          {inStock ? 'In stock' : 'Out of stock'}
        </div>
        <div className="cart-item__actions" aria-label="Item actions">
          <div className="qty-stepper" role="group" aria-label="Quantity">
            <button
              className="qty-btn qty-btn--minus"
              type="button"
              onClick={handleDecrease}
              disabled={updating}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="qty-value" aria-live="polite">{qty}</span>
            <button
              className="qty-btn qty-btn--plus"
              type="button"
              onClick={handleIncrease}
              disabled={updating}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            className="delete-btn"
            type="button"
            onClick={requestDelete}
            disabled={deleting}
            aria-label="Remove item"
            title="Remove item"
          >
            {/* Trash icon (inline SVG) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9 3h6a1 1 0 0 1 1 1v2h3a1 1 0 1 1 0 2h-1l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8H5a1 1 0 1 1 0-2h3V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-1 4a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}