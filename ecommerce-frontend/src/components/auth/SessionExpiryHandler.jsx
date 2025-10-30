import React from 'react';
import { useSessionExpiry } from '../../hooks/use_auth';
import SessionExpiredModal from '../modals/session_expired/SessionExpiredModal';

export default function SessionExpiryHandler() {
  const { showSessionExpired, hideSessionExpired, message } = useSessionExpiry();

  return (
    <SessionExpiredModal 
      open={showSessionExpired} 
      onClose={hideSessionExpired}
      message={message}
    />
  );
}