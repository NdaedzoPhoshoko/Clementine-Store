import React, { useEffect, useState } from 'react';
import './EditOrderInfo.css';
import useUpdateOrderShipping from '../../hooks/useUpdateOrderShipping.js';

export default function EditOrderInfo({ open, onClose, orderId, shipping, onSuccess }) {
  const { update, loading, error } = useUpdateOrderShipping();
  const [form, setForm] = useState({ name: '', phone_number: '', address: '', city: '', province: '', postal_code: '' });

  useEffect(() => {
    if (!open) return;
    const s = shipping || {};
    setForm({
      name: String(s.name || ''),
      phone_number: String(s.phone_number || ''),
      address: String(s.address || ''),
      city: String(s.city || ''),
      province: String(s.province || ''),
      postal_code: String(s.postal_code || ''),
    });
  }, [open, shipping]);

  const onChangeField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const res = await update(orderId, form);
    if (res) {
      if (typeof onSuccess === 'function') await onSuccess(res);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit shipping information">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Edit Shipping</div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal__body">
          <div className="kv-grid">
            <div className="kv"><div className="kv__label">Recipient</div><input className="form-control" type="text" name="recipient" autoComplete="name" placeholder="Full name" value={form.name} onChange={(e) => onChangeField('name', e.target.value)} disabled={loading} /></div>
            <div className="kv"><div className="kv__label">Phone</div><input className="form-control" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="e.g. 012 345 6789" value={form.phone_number} onChange={(e) => onChangeField('phone_number', e.target.value)} disabled={loading} /></div>
            <div className="kv kv--full"><div className="kv__label">Address</div><input className="form-control" type="text" name="address" autoComplete="street-address" placeholder="Street and number" value={form.address} onChange={(e) => onChangeField('address', e.target.value)} disabled={loading} /></div>
            <div className="kv"><div className="kv__label">City</div><input className="form-control" type="text" name="city" autoComplete="address-level2" placeholder="City" value={form.city} onChange={(e) => onChangeField('city', e.target.value)} disabled={loading} /></div>
            <div className="kv"><div className="kv__label">Province</div><input className="form-control" type="text" name="province" autoComplete="address-level1" placeholder="Province" value={form.province} onChange={(e) => onChangeField('province', e.target.value)} disabled={loading} /></div>
            <div className="kv"><div className="kv__label">Postal Code</div><input className="form-control" type="text" name="postal" autoComplete="postal-code" inputMode="numeric" placeholder="Postal code" value={form.postal_code} onChange={(e) => onChangeField('postal_code', e.target.value)} disabled={loading} /></div>
          </div>
          {error && <div className="edit-modal__error">Could not update shipping</div>}
        </div>
        <div className="modal__footer edit-modal__actions">
          <button className="account-btn account-btn--dark" onClick={save} disabled={loading}>Save</button>
          <button className="account-btn account-btn--light" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}