import React, { useEffect, useState, useRef } from 'react';
import './EnterAdminToggle.css';
import useFetchMe from '../../hooks/useFetchMe.js';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'admin:mode';

export default function EnterAdminToggle() {
  const { data } = useFetchMe();
  const isAdmin = Boolean(data?.isAdmin);
  const navigate = useNavigate();
  const firstRunRef = useRef(true);
  const [enabled, setEnabled] = useState(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) || 'off') === 'on';
    } catch {
      return false;
    }
  });
  const [intentMsg, setIntentMsg] = useState(null);
  const intentTimerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
      window.dispatchEvent(new CustomEvent('admin:mode_changed', { detail: { enabled } }));
    } catch {}
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setIntentMsg(enabled ? 'You have now entered Admin Mode.' : 'You have exited Admin Mode.');
    if (intentTimerRef.current) clearTimeout(intentTimerRef.current);
    intentTimerRef.current = setTimeout(() => setIntentMsg(null), 3000);
    navigate(enabled ? '/admin/dashboard' : '/shop-all');
  }, [enabled]);

  if (!isAdmin) return null;

  return (
    <div className="admin-toggle" title="Toggle admin mode">
      <span className="admin-toggle__label">Open Admin Mode</span>
      <button
        type="button"
        className={`admin-toggle__switch ${enabled ? 'on' : 'off'}`}
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled((v) => !v)}
      >
        {enabled ? 'On' : 'Off'}
      </button>
      {intentMsg ? (
        <div className="admin-toggle__intent" role="status" aria-live="polite">{intentMsg}</div>
      ) : null}
    </div>
  );
}
