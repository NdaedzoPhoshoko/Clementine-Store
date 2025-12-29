import React, { useEffect, useRef } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  closeOnOverlay = true,
  isDangerous = false,
  isLoading = false,
  loadingText = 'Processing...',
}) {
  const didCloseRef = useRef(false);

  const handleClose = () => {
    if (didCloseRef.current || isLoading) return;
    didCloseRef.current = true;
    onClose && onClose();
  };

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm && onConfirm();
  };

  useEffect(() => {
    if (open) {
      didCloseRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, isLoading]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  return (
    <div
      className="confirm-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div className={`confirm-modal-card ${open ? 'animate-enter' : ''}`}>
        <div className={`modal-header-icon ${isDangerous ? 'dangerous' : ''}`}>
          {isDangerous ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ) : (
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          )}
        </div>

        <div className="modal-content">
          <h2 id="confirm-modal-title" className="modal-title">{title}</h2>
          <p id="confirm-modal-desc" className="modal-message">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="confirm-modal-btn cancel" onClick={handleClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button 
            className={`confirm-modal-btn confirm ${isDangerous ? 'dangerous' : ''}`} 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="spinner-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 12 12)">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            )}
            {isLoading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
