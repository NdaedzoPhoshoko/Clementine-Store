import React from 'react';
import { useSessionExpiry } from '../../hooks/use_auth';
import SessionExpiredModal from '../modals/session_expired/SessionExpiredModal';
import { useLocation } from 'react-router-dom';

export default function SessionExpiryHandler() {
  const { showSessionExpired, hideSessionExpired, message } = useSessionExpiry();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  return (
    <SessionExpiredModal 
      open={showSessionExpired} 
      onClose={hideSessionExpired}
      message={message}
      redirectPath={`/auth/login?next=${next}`}
    />
  );
}
