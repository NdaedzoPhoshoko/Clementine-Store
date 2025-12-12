import React, { useEffect, useMemo, useState } from 'react';
import './Settings.css';
import apiFetch from '../../../utils/apiFetch.js';

export default function Settings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const demo = [
      { id: 1, name: 'Clementine Owner', email: 'owner@clementine.store', role: 'Super Admin', status: 'Active' },
      { id: 2, name: 'Jane Manager', email: 'jane@clementine.store', role: 'Admin', status: 'Active' },
      { id: 3, name: 'Mark Auditor', email: 'mark@clementine.store', role: 'Admin', status: 'Disabled' }
    ];
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch('/api/admins?limit=50', { headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const list = Array.isArray(payload?.items) ? payload.items : demo;
        setAdmins(list.map((a, i) => ({ id: a.id ?? i + 1, name: a.name ?? '', email: a.email ?? '', role: a.role ?? 'Admin', status: a.status ?? 'Active' })));
      } catch (e) {
        setAdmins(demo);
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => String(a.name).toLowerCase().includes(q) || String(a.email).toLowerCase().includes(q) || String(a.role).toLowerCase().includes(q));
  }, [admins, search]);

  const onPromoteDemote = (id) => {
    setAdmins((list) => list.map((a) => (a.id === id ? { ...a, role: a.role === 'Super Admin' ? 'Admin' : 'Super Admin' } : a)));
  };
  const onEnableDisable = (id) => {
    setAdmins((list) => list.map((a) => (a.id === id ? { ...a, status: a.status === 'Active' ? 'Disabled' : 'Active' } : a)));
  };
  const onRemove = (id) => {
    setAdmins((list) => list.filter((a) => a.id !== id));
  };
  const onAddAdmin = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const nextId = Math.max(0, ...admins.map((a) => a.id)) + 1;
    setAdmins((list) => [{ id: nextId, name: newName.trim(), email: newEmail.trim(), role: 'Admin', status: 'Active' }, ...list]);
    setNewName('');
    setNewEmail('');
    setShowAdd(false);
  };

  return (
    <div className="admin_settings__page">
      <div className="admin_settings__panel">
        <div className="admin_settings__header">
          <div className="admin_settings__titles">
            <h1 className="admin_settings__title">Admin Settings</h1>
            <div className="admin_settings__sub">Manage administrative users for Clementine Store</div>
          </div>
          <div className="admin_settings__header_right">
            <div className="admin_settings__search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="admin_settings__search_input" placeholder="Search admins" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search admins" />
            </div>
            <button className="admin_settings__add_btn" onClick={() => setShowAdd((v) => !v)} aria-label="Add admin">{showAdd ? 'Close' : 'Add Admin'}</button>
          </div>
        </div>

        {showAdd && (
          <form className="admin_settings__add_form" onSubmit={onAddAdmin} aria-label="Add admin form">
            <input className="admin_settings__field" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="admin_settings__field" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button className="admin_settings__submit" type="submit">Save</button>
          </form>
        )}

        <div className="admin_settings__list">
          <table className="admin_settings__table">
            <thead className="admin_settings__thead">
              <tr className="admin_settings__row">
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--id">Admin No</th>
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--name">Name</th>
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--email">Email</th>
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--role">Role</th>
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--status">Status</th>
                <th className="admin_settings__cell admin_settings__cell--th admin_settings__cell--actions">Actions</th>
              </tr>
            </thead>
            <tbody className="admin_settings__tbody">
              {loading ? (
                <tr className="admin_settings__row"><td className="admin_settings__cell" colSpan={6}>Loading…</td></tr>
              ) : error ? (
                <tr className="admin_settings__row"><td className="admin_settings__cell" colSpan={6}>Error loading admins</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="admin_settings__row"><td className="admin_settings__cell" colSpan={6}>No admins found</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="admin_settings__row">
                    <td className="admin_settings__cell admin_settings__cell--id">{a.id}</td>
                    <td className="admin_settings__cell admin_settings__cell--name">{a.name}</td>
                    <td className="admin_settings__cell admin_settings__cell--email">{a.email}</td>
                    <td className="admin_settings__cell admin_settings__cell--role">{a.role}</td>
                    <td className="admin_settings__cell admin_settings__cell--status">
                      <span className={`admin_settings__badge ${a.status === 'Active' ? 'admin_settings__badge--active' : 'admin_settings__badge--disabled'}`}>{a.status}</span>
                    </td>
                    <td className="admin_settings__cell admin_settings__cell--actions">
                      <button className="admin_settings__btn admin_settings__btn--primary" onClick={() => onPromoteDemote(a.id)}>{a.role === 'Super Admin' ? 'Demote' : 'Promote'}</button>
                      <button className="admin_settings__btn admin_settings__btn--muted" onClick={() => onEnableDisable(a.id)}>{a.status === 'Active' ? 'Disable' : 'Enable'}</button>
                      <button className="admin_settings__btn admin_settings__btn--danger" onClick={() => onRemove(a.id)}>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
