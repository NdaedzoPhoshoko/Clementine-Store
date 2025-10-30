import { useState, useCallback, useEffect } from 'react';
import { authStorage } from './authStorage';
import { SESSION_EXPIRED_EVENT } from './useAuthRefresh';

export default function useSessionExpiry() {
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [message, setMessage] = useState('Your session has expired. Please sign in again to continue.');

  const handleSessionExpired = useCallback(() => {
    // Clear auth data
    authStorage.clear();
    
    // Show session expired modal
    setShowSessionExpired(true);
  }, []);

  const hideSessionExpired = useCallback(() => {
    setShowSessionExpired(false);
    setMessage('Your session has expired. Please sign in again to continue.');
  }, []);

  // Listen for session expired events
  useEffect(() => {
    const handleEvent = (e) => {
      const detailMsg = e?.detail?.message;
      if (typeof detailMsg === 'string' && detailMsg.trim().length > 0) {
        setMessage(detailMsg.trim());
      }
      handleSessionExpired();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleEvent);
    
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleEvent);
    };
  }, [handleSessionExpired]);

  return {
    showSessionExpired,
    message,
    handleSessionExpired,
    hideSessionExpired
  };
}