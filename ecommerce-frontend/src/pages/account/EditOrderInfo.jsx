import React, { useEffect, useState } from 'react';
import './EditOrderInfo.css';
import useUpdateOrderShipping from '../../hooks/useUpdateOrderShipping.js';

export default function EditOrderInfo({ open, onClose, orderId, shipping, onSuccess }) {
  const { update, loading, error } = useUpdateOrderShipping();
  const [form, setForm] = useState({ name: '', phone_number: '', address: '', city: '', province: '', postal_code: '' });
  const [errors, setErrors] = useState({ name: '', phone_number: '', address: '', city: '', province: '', postal_code: '' });
  const [touched, setTouched] = useState({ name: false, phone_number: false, address: false, city: false, province: false, postal_code: false });

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
  const onBlurField = (k) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    const nextErrors = { name: '', phone_number: '', address: '', city: '', province: '', postal_code: '' };
    const name = String(form.name || '').trim();
    const phone = String(form.phone_number || '').trim();
    const address = String(form.address || '').trim();
    const city = String(form.city || '').trim();
    const province = String(form.province || '').trim();
    const postal = String(form.postal_code || '').trim();
    if (!name) nextErrors.name = 'Enter recipient name';
    const digitsPhone = phone.replace(/\D+/g, '');
    if (digitsPhone.length < 10) nextErrors.phone_number = 'Enter a valid phone number';
    if (!address) nextErrors.address = 'Enter street address';
    if (!city) nextErrors.city = 'Enter city';
    if (!province) nextErrors.province = 'Enter province';
    const digitsPostal = postal.replace(/\D+/g, '');
    if (digitsPostal.length !== 4) nextErrors.postal_code = 'Enter a 4-digit postal code';
    setErrors(nextErrors);
  }, [form]);

  const save = async () => {
    const hasInvalid = Object.values(errors).some((m) => Boolean(m));
    if (hasInvalid) {
      setTouched({ name: true, phone_number: true, address: true, city: true, province: true, postal_code: true });
      return;
    }
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
            <div className="kv"><div className="kv__label">Recipient</div><input className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`} type="text" name="recipient" autoComplete="name" placeholder="Full name" value={form.name} onChange={(e) => onChangeField('name', e.target.value)} onBlur={() => onBlurField('name')} aria-invalid={Boolean(errors.name && touched.name)} disabled={loading} />{errors.name && touched.name ? (<div className="field-error">{errors.name}</div>) : null}</div>
            <div className="kv"><div className="kv__label">Phone</div><input className={`form-control ${errors.phone_number && touched.phone_number ? 'is-invalid' : ''}`} type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="e.g. 012 345 6789" value={form.phone_number} onChange={(e) => onChangeField('phone_number', e.target.value)} onBlur={() => onBlurField('phone_number')} aria-invalid={Boolean(errors.phone_number && touched.phone_number)} disabled={loading} />{errors.phone_number && touched.phone_number ? (<div className="field-error">{errors.phone_number}</div>) : null}</div>
            <div className="kv kv--address"><div className="kv__label">Address</div><input className={`form-control ${errors.address && touched.address ? 'is-invalid' : ''}`} type="text" name="address" autoComplete="street-address" placeholder="Street and number" value={form.address} onChange={(e) => onChangeField('address', e.target.value)} onBlur={() => onBlurField('address')} aria-invalid={Boolean(errors.address && touched.address)} disabled={loading} />{errors.address && touched.address ? (<div className="field-error">{errors.address}</div>) : null}</div>
            <div className="kv"><div className="kv__label">City</div><input className={`form-control ${errors.city && touched.city ? 'is-invalid' : ''}`} type="text" name="city" autoComplete="address-level2" placeholder="City" value={form.city} onChange={(e) => onChangeField('city', e.target.value)} onBlur={() => onBlurField('city')} aria-invalid={Boolean(errors.city && touched.city)} disabled={loading} />{errors.city && touched.city ? (<div className="field-error">{errors.city}</div>) : null}</div>
            <div className="kv"><div className="kv__label">Province</div><input className={`form-control ${errors.province && touched.province ? 'is-invalid' : ''}`} type="text" name="province" autoComplete="address-level1" placeholder="Province" value={form.province} onChange={(e) => onChangeField('province', e.target.value)} onBlur={() => onBlurField('province')} aria-invalid={Boolean(errors.province && touched.province)} disabled={loading} />{errors.province && touched.province ? (<div className="field-error">{errors.province}</div>) : null}</div>
            <div className="kv"><div className="kv__label">Postal Code</div><input className={`form-control ${errors.postal_code && touched.postal_code ? 'is-invalid' : ''}`} type="text" name="postal" autoComplete="postal-code" inputMode="numeric" placeholder="Postal code" value={form.postal_code} onChange={(e) => onChangeField('postal_code', e.target.value)} onBlur={() => onBlurField('postal_code')} aria-invalid={Boolean(errors.postal_code && touched.postal_code)} disabled={loading} />{errors.postal_code && touched.postal_code ? (<div className="field-error">{errors.postal_code}</div>) : null}</div>
          </div>
          {error && <div className="edit-modal__error">Could not update shipping</div>}
        </div>
        <div className="modal__footer edit-modal__actions">
          <button className="account-btn account-btn--dark" onClick={save} disabled={loading || Object.values(errors).some((m) => Boolean(m))}>Save</button>
          <button className="account-btn account-btn--light" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}