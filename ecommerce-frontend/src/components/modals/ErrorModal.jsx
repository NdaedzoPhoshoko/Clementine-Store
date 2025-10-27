import { useEffect, useRef, useState } from 'react';
import './ErrorModal.css';

export default function ErrorModal({ message = 'An unexpected error occurred.', onClose, durationMs = 12000 }) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const cleanupTimerRef = useRef(null);

  useEffect(() => {
    // Auto-close after duration
    closeTimerRef.current = setTimeout(() => setClosing(true), durationMs);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, [durationMs]);

  useEffect(() => {
    // After fade-out completes, run onClose
    if (closing) {
      cleanupTimerRef.current = setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 500); // match fade-out duration in CSS
    }
  }, [closing, onClose]);

  const handleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
  };

  return (
    <div
      className={`error-modal ${closing ? 'error-modal--closing' : 'error-modal--open'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <button
        className="error-modal__close"
        onClick={handleClose}
        aria-label="Dismiss error"
        title="Dismiss"
      >
        ×
      </button>
      <p className="error-modal__text">{String(message || '').trim()}</p>
    </div>
  );
}