import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './CheckoutConflictModal.css';
import useRevertCheckout from '../../../hooks/for_cart/useRevertCheckout';
import { useCart } from '../../../hooks/for_cart/CartContext';

export default function CheckoutConflictModal({ onClose, onResolved }) {
  const navigate = useNavigate();
  const { revertCheckout, loading: reverting } = useRevertCheckout();
  const { refresh } = useCart();

  const handleGoToCart = () => {
    navigate('/cart');
    onClose();
  };

  const handleCancelCheckout = async () => {
    try {
      await revertCheckout();
      await refresh();
      if (onResolved) onResolved();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return createPortal(
    <div className="checkout-conflict-overlay" onClick={onClose}>
      <div className="checkout-conflict-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="checkout-conflict__close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="checkout-conflict__title">Checkout in Progress</h3>
        <p className="checkout-conflict__desc">
          Please complete or cancel your current checkout before adding new items.
        </p>
        <div className="checkout-conflict__actions">
          <button 
            className="checkout-conflict__btn checkout-conflict__btn--primary"
            onClick={handleGoToCart}
          >
            Go to Cart to Complete
          </button>
          <button 
            className="checkout-conflict__btn checkout-conflict__btn--secondary"
            onClick={handleCancelCheckout}
            disabled={reverting}
          >
            {reverting ? 'Cancelling Checkout...' : 'Cancel Checkout'}
          </button>
          <button 
             className="checkout-conflict__btn checkout-conflict__btn--ghost"
             onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
