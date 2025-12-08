import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import useFetchCart from './useFetchCart.js';
import useAuthUser from '../use_auth/useAuthUser.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const { isAuthed } = useAuthUser();

  // Fetch cart when authorized; updates immediately on auth changes
  const { cart, items: fetchedItems, meta: fetchedMeta, loading, error, refresh, clearCache } = useFetchCart({ enabled: !!isAuthed });

  // Hydrate context whenever backend provides fresh data
  useEffect(() => {
    if (Array.isArray(fetchedItems)) setItems(fetchedItems);
    if (fetchedMeta !== undefined) setMeta(fetchedMeta);
  }, [fetchedItems, fetchedMeta]);

  const updateItemQuantity = useCallback((cartItemId, nextQty) => {
    setItems((prev) => {
      const qtyNum = Number(nextQty) || 0;
      return Array.isArray(prev)
        ? prev.map((it) => (Number(it.cart_item_id) === Number(cartItemId) ? { ...it, quantity: qtyNum } : it))
        : [];
    });
  }, []);

  const hydrate = useCallback(({ items: nextItems, meta: nextMeta } = {}) => {
    if (Array.isArray(nextItems)) setItems(nextItems);
    if (nextMeta !== undefined) setMeta(nextMeta);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setMeta(null);
    try { clearCache && clearCache(); } catch {}
  }, [clearCache]);

  const value = useMemo(() => ({
    cart,
    items,
    meta,
    setItems,
    setMeta,
    updateItemQuantity,
    hydrate,
    loading,
    error,
    refresh,
    clearCart,
  }), [cart, items, meta, updateItemQuantity, hydrate, loading, error, refresh, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
