import React, { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);

export function ManageProductsProvider({ children }) {
  const [activeSection, setActiveSection] = useState('products');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [stock, setStock] = useState('All Stock');
  const [stars, setStars] = useState('All Stars');
  const [reviewRange, setReviewRange] = useState('All Counts');

  const value = useMemo(() => ({
    activeSection, setActiveSection,
    query, setQuery,
    status, setStatus,
    stock, setStock,
    stars, setStars,
    reviewRange, setReviewRange,
  }), [activeSection, query, status, stock, stars, reviewRange]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export default function useManageProducts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManageProducts must be used within ManageProductsProvider');
  return ctx;
}
