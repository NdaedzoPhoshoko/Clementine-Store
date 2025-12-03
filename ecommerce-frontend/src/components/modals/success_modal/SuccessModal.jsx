import React, { useEffect, useRef } from 'react';
import './SuccessModal.css';

export default function SuccessModal({
  open = false,
  onClose,
  onAfterClose,
  variant = 'success',
  title,
  message = '',
  autoCloseMs = 10000,
  closeOnOverlay = true,
}) {
  const didCloseRef = useRef(false);

  const handleClose = () => {
    if (didCloseRef.current) return;
    didCloseRef.current = true;
    onClose && onClose();
    onAfterClose && onAfterClose();
  };

  useEffect(() => {
    if (open) {
      didCloseRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  const isSuccess = variant === 'success';
  const heading = title ?? (isSuccess ? 'Sign In' : 'Try Again');
  const defaultMsg = isSuccess
    ? 'Thanks for signing up. You can now login your account.'
    : 'There was an error creating your account.';
  const displayMessage = message || defaultMsg;

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="success-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      aria-describedby="success-modal-desc"
    >
      <div className={`success-modal-card ${isSuccess ? 'success-modal--success' : 'success-modal--error'}`}>
        <button className="close-btn" aria-label="Close" onClick={handleClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="modal-icon" aria-hidden="true">
          {isSuccess ? (
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle className="ring" cx="32" cy="32" r="28" fill="none" strokeWidth="4" />
              <path className="mark" d="M22 33l8 8 14-16" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle className="ring" cx="32" cy="32" r="28" fill="none" strokeWidth="4" />
              <path className="mark" d="M24 24l16 16M40 24l-16 16" fill="none" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <h2 id="success-modal-title" className="modal-title">{heading}</h2>
        <p id="success-modal-desc" className="modal-message">{displayMessage}</p>
      </div>
    </div>
  );
}
