import React, { useEffect, useState } from 'react';
import './AccountSideBar.css';
import useAuthUser from '../../hooks/use_auth/useAuthUser.js';

export default function AccountSideBar({ active, onSelect }) {
  const [initialSkeleton, setInitialSkeleton] = useState(true);
  const { user } = useAuthUser();
  const displayName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest';
  const initials = (() => {
    const parts = String(displayName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return (parts[0][0] || '').toUpperCase();
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return `${first}${last}`.toUpperCase();
  })();
  useEffect(() => {
    const t = setTimeout(() => setInitialSkeleton(false), 450);
    return () => clearTimeout(t);
  }, []);
  const Item = ({ k, label }) => (
    <li
      className={`account-sidebar__item ${active === k ? 'is-active' : ''}`}
      role="menuitem"
      tabIndex={0}
      onClick={() => onSelect && onSelect(k)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(k);
        }
      }}
    >
      <span className={`account-sidebar__label ${k === 'logout' ? 'account-sidebar__label--danger' : ''}`}>{label}</span>
    </li>
  );

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      <div
        className="account-sidebar__user"
        role="button"
        tabIndex={0}
        aria-label="Open profile"
        onClick={() => onSelect && onSelect('profile')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect && onSelect('profile');
          }
        }}
      >
        {initialSkeleton ? (
          <>
            <span className="sidebar-avatar__circle skeleton-avatar" aria-hidden="true" />
            <div className="account-sidebar__identity">
              <div className="account-sidebar__name"><span className="skeleton-line skeleton-name" /></div>
            </div>
          </>
        ) : (
          <>
            <span className="sidebar-avatar__circle" aria-hidden="true">
              <span className="sidebar-avatar__initials">{initials}</span>
            </span>
            <div className="account-sidebar__identity">
              <div className="account-sidebar__name">{displayName}</div>
            </div>
          </>
        )}
      </div>
      <div className="account-sidebar__section">
        <div className="account-sidebar__title">My account</div>
        <ul className="account-sidebar__list" role="menu">
          <Item k="orders" label="My orders" />
          <Item k="addresses" label="My addresses" />
          <Item k="payments" label="Payments" />
        </ul>
      </div>
      <div className="account-sidebar__section">
        <div className="account-sidebar__title">Settings</div>
        <ul className="account-sidebar__list" role="menu">
          <Item k="faq" label="FAQ" />
          <Item k="support" label="Support" />
          <Item k="logout" label="Log out" />
        </ul>
      </div>
    </aside>
  );
}