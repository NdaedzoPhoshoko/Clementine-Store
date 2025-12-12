import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useFetchMe from '../../hooks/useFetchMe.js';
import { authStorage } from '../../hooks/use_auth';

export default function RequireAdmin({ children }) {
  const location = useLocation();
  const authed = authStorage.isAuthenticated();
  const cached = authStorage.getUser();
  if (authed && cached?.isAdmin) return children;
  const { data, loading } = useFetchMe({ enabled: authed });
  if (loading) return null;
  if (authed && data?.isAdmin) return children;
  if (authed && data && !data.isAdmin) return <Navigate to="/" replace />;
  return <Navigate to={`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
