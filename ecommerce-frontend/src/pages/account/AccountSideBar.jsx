import React from 'react';
import './AccountSideBar.css';

export default function AccountSideBar({ active, onSelect }) {
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
      <span className="account-sidebar__label">{label}</span>
    </li>
  );

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
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