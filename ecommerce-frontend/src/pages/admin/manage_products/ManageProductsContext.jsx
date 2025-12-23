import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { extractIdFromSlug } from '../../../utils/slugUtils';

const Ctx = createContext(null);

export function ManageProductsProvider({ children }) {
  const [activeSection, setActiveSection] = useState('products');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Status');
  const [stock, setStock] = useState('All Stock');
  const [stars, setStars] = useState('All Stars');
  const [reviewRange, setReviewRange] = useState('All Counts');
  const [innerAction, setInnerAction] = useState('all');
  const [currentProductId, setCurrentProductId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const segs = location.pathname.split('/').filter(Boolean);
    if (segs[0] === 'admin' && segs[1] === 'product_management') {
      const section = segs[2] || 'products';
      const action = segs[3] || 'all';
      const idOrSlug = segs[4] != null ? segs[4] : null;
      const id = idOrSlug != null ? Number(extractIdFromSlug(idOrSlug)) : null;
      setActiveSection(section);
      const normalizedAction = section === 'inventory' && action === 'all' ? 'adjust' : action;
      setInnerAction(normalizedAction);
      setCurrentProductId(Number.isFinite(id) ? id : null);
    }
  }, [location.pathname]);

  const value = useMemo(() => ({
    activeSection, setActiveSection,
    query, setQuery,
    status, setStatus,
    stock, setStock,
    stars, setStars,
    reviewRange, setReviewRange,
    innerAction, setInnerAction,
    currentProductId, setCurrentProductId,
  }), [activeSection, query, status, stock, stars, reviewRange
  , innerAction, currentProductId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export default function useManageProducts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManageProducts must be used within ManageProductsProvider');
  return ctx;
}
