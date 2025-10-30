import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../success_modal/SuccessModal.css';

export default function SessionExpiredModal({
  open = false,
  onClose,
  autoRedirectMs = 3000,
  redirectPath = '/auth/login',
  message = 'Your session has expired. Please sign in again to continue.',
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
      navigate(redirectPath);
    }, autoRedirectMs);

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
        navigate(redirectPath);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, autoRedirectMs, onClose, navigate, redirectPath]);

  if (!open) return null;

  const handleClick = () => {
    if (onClose) onClose();
    navigate(redirectPath);
  };

  return (
    <div className="success-modal-overlay" onClick={handleClick}>
      <div className="success-modal-card success-modal--error" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="52" height="52">
            <circle className="ring" cx="12" cy="12" r="10" />
            <line className="mark" x1="12" y1="7" x2="12" y2="13" />
            <circle className="mark" cx="12" cy="17" r="1" />
          </svg>
        </div>
        <h2 className="modal-title">Session Expired</h2>
        <p className="modal-message">{message}</p>
        <button className="close-btn" onClick={handleClick} aria-label="Sign In">→</button>
      </div>
    </div>
  );
}