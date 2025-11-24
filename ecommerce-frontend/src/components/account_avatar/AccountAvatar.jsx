import React from 'react';
import { Link } from 'react-router-dom';
import useAuthUser from '../../hooks/use_auth/useAuthUser.js';
import './AccountAvatar.css';

function getInitialsFromName(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return `${first}${last}`.toUpperCase();
}

export default function AccountAvatar({ asLink = true, onClick }) {
  const { user, isAuthed } = useAuthUser();
  const displayName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = getInitialsFromName(displayName);

  if (asLink) {
    return (
      <Link
        to="/account"
        className="nav-icon account-avatar"
        aria-label={isAuthed && initials ? `Account (${displayName})` : 'Account'}
        title={displayName || 'Account'}
      >
        {isAuthed && initials ? (
          <span className="account-avatar__circle" aria-hidden="true">
            <span className="account-avatar__initials">{initials}</span>
          </span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="nav-icon account-avatar account-avatar--plain"
      aria-label={isAuthed && initials ? `Account (${displayName})` : 'Account'}
      title={displayName || 'Account'}
      onClick={onClick}
    >
      {isAuthed && initials ? (
        <span className="account-avatar__circle" aria-hidden="true">
          <span className="account-avatar__initials">{initials}</span>
        </span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </button>
  );
}