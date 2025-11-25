import React, { useMemo, useState, useEffect } from 'react'
import './Checkout.css'
import { useLocation } from 'react-router-dom'
import { useCart } from '../../hooks/for_cart/CartContext.jsx'
import useFetchMyShippingDetails from '../../hooks/useFetchMyShippingDetails.js'

// Currency formatter (Rand)
const format = (n) => `R${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Checkout() {
  const location = useLocation();
  const { items: cartItems } = useCart();
  const { items: shippingItems } = useFetchMyShippingDetails({ enabled: true });

  // Payment method selection
  const [method, setMethod] = useState('card')

  // Credit card form state (demo only)
  const [card, setCard] = useState({
    name: 'Angeline Wayne',
    number: '1234 5678 9101 1121',
    exp: '',
    cvv: ''
  })
  const [errors, setErrors] = useState({ exp: '', cvv: '' })
  const [selectedSaved, setSelectedSaved] = useState(null)
  const [saveCardChecked, setSaveCardChecked] = useState(false)

  // Preview saved cards (click to prefill form)
  const initialSavedCards = [
    { id: 'c1', brand: 'visa', name: 'Angeline Wayne', number: '4111 1111 1111 1111', exp: '12/2026' },
    { id: 'c2', brand: 'mastercard', name: 'Angeline Wayne', number: '5555 4444 3333 1111', exp: '09/2027' }
  ]
  const [savedCards, setSavedCards] = useState(initialSavedCards)
  // Persist saved cards locally so they survive reloads
  const persistSavedCards = (arr) => {
    try { localStorage.setItem('saved-cards:v1', JSON.stringify(arr)) } catch {}
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved-cards:v1')
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setSavedCards(arr)
      }
    } catch {}
  }, [])
  const maskCard = (num) => `•••• •••• •••• ${num.replace(/\D/g, '').slice(-4)}`
  const applySavedCard = (sc) => {
    setSelectedSaved(sc.id)
    setCard({ name: sc.name, number: sc.number, exp: sc.exp, cvv: '' })
  }
  const removeSavedCard = (id) => {
    setSavedCards((prev) => {
      const next = prev.filter((c) => c.id !== id)
      persistSavedCards(next)
      return next
    })
    setSelectedSaved((sel) => (sel === id ? null : sel))
  }
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState(null)
  const confirmRemove = () => {
    if (pendingRemove) removeSavedCard(pendingRemove.id)
    setConfirmOpen(false)
    setPendingRemove(null)
  }
  const cancelRemove = () => {
    setConfirmOpen(false)
    setPendingRemove(null)
  }
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelRemove() }
    if (confirmOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen])
  
  // Save current card to saved cards when requested
  const handlePay = () => {
    const ready = isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim()
    if (!ready) return
    if (saveCardChecked) {
      const brand = detectBrand(card.number)
      const id = `c_${Date.now()}`
      const entry = { id, brand, name: card.name.trim(), number: card.number.replace(/\s+/g, ' ').trim(), exp: card.exp }
      setSavedCards((prev) => {
        const digits = card.number.replace(/\D/g, '')
        const last4 = digits.slice(-4)
        const exists = prev.some((c) => c.number.replace(/\D/g, '').slice(-4) === last4 && c.name === entry.name && c.exp === entry.exp)
        const next = exists ? prev : [...prev, entry]
        persistSavedCards(next)
        return next
      })
    }
    // In a real integration, we would call the payment API here
  }

  // EFT/bank accounts removed per request

  // Helpers: expiry formatting and validation, CVV validation (Visa/Mastercard => 3 digits)
  const formatExp = (input) => {
    const digits = input.replace(/\D/g, '').slice(0, 6)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  const isValidExp = (exp) => {
    if (!/^\d{2}\/\d{4}$/.test(exp)) return false
    const month = parseInt(exp.slice(0, 2), 10)
    const year = parseInt(exp.slice(3), 10)
    if (month < 1 || month > 12) return false
    const now = new Date()
    const cm = now.getMonth() + 1
    const cy = now.getFullYear()
    if (year < cy) return false
    if (year === cy && month < cm) return false
    return true
  }

  const isValidCvv = (cvv) => /^\d{3}$/.test(cvv)

  // Detect card brand from number (Visa / Mastercard)
  const detectBrand = (number) => {
    const digits = number.replace(/\D/g, '')
    // Visa: starts with 4, length 13–19 (we check prefix + reasonable length)
    if (/^4\d{12,18}$/.test(digits)) return 'visa'
    // Mastercard: 51–55 OR 2221–2720
    const firstTwo = parseInt(digits.slice(0, 2), 10)
    const firstFour = parseInt(digits.slice(0, 4), 10)
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
      return 'mastercard'
    }
    return 'unknown'
  }

  // Shipping details with edit toggle (prefill from saved shipping if available)
  const [shipping, setShipping] = useState({
    name: 'Angeline Wayne',
    address: '45 Rose Ave, Sunnyside',
    city: 'Springfield',
    province: 'CA',
    postal_code: '90001',
    phone_number: ''
  })
  const [email, setEmail] = useState('angeline@example.com')
  const [editingShip, setEditingShip] = useState(false)

  useEffect(() => {
    const arr = Array.isArray(shippingItems) ? shippingItems : []
    if (arr.length > 0) {
      const s = arr[0]
      setShipping({
        name: s.name || shipping.name,
        address: s.address || shipping.address,
        city: s.city || shipping.city,
        province: s.province || shipping.province,
        postal_code: s.postal_code || shipping.postal_code,
        phone_number: s.phone_number || shipping.phone_number
      })
    }
  }, [shippingItems])

  // Items from navigation state or cart context
  const [items, setItems] = useState([])
  const [showAllItems, setShowAllItems] = useState(false)
  useEffect(() => {
    const fromState = Array.isArray(location?.state?.items) ? location.state.items : null
    const src = fromState || cartItems
    const mapped = Array.isArray(src)
      ? src.map((it, idx) => ({
          id: it.cart_item_id || it.product_id || idx,
          title: it.name || it.title || 'Item',
          price: Number(it.price) || 0,
          qty: Number(it.quantity || it.qty || 1),
          image_url: typeof it.image_url === 'string' ? it.image_url : ''
        }))
      : []
    setItems(mapped)
  }, [location?.state?.items, cartItems])

  // Coupon
  const [coupon, setCoupon] = useState('GRATISONGKR')

  // Quantity handlers removed; qty is read-only in summary

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.qty, 0), [items])
  const tax = useMemo(() => subtotal * 0.15, [subtotal])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])

  return (
    <div className="checkout-page">
      <div className="checkout-grid">
        {/* Left: Payment */}
        <section className="pay-card">
          <h1 className="page-title">Payment</h1>
          <p className="page-sub">Select Payment Method</p>
          {/* Credit card option + form */}
          <label className={`method-option ${method === 'card' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymethod"
              value="card"
              checked={method === 'card'}
              onChange={(e) => setMethod(e.target.value)}
            />
            <div className="method-content">
              <span className="method-title">Credit Card</span>
              <div className="brandrow" aria-label="Accepted cards">
                <img src="/icons/visa_inc_logo.png" alt="Visa" className="brand-img visa" />
                <img src="/icons/master_card_logo.png" alt="Mastercard" className="brand-img mc" />
              </div>
            </div>
          </label>

          {/* Saved card options */}
          <div className="saved-cards" aria-label="Saved cards">
            <div className="saved-title">Saved Cards</div>
            {savedCards.length === 0 ? (
              <div className="saved-empty" role="status" aria-live="polite">No previous card was saved</div>
            ) : (
              <div className="saved-list">
                {savedCards.map((sc) => (
                  <div
                    key={sc.id}
                    className={`saved-card ${selectedSaved === sc.id ? 'selected' : ''}`}
                    onClick={() => applySavedCard(sc)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedSaved === sc.id}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySavedCard(sc) }}
                  >
                    <img
                      src={sc.brand === 'visa' ? '/icons/visa_inc_logo.png' : '/icons/master_card_logo.png'}
                      alt={sc.brand === 'visa' ? 'Visa' : 'Mastercard'}
                      className="brand-img"
                    />
                    <div className="saved-meta">
                      <div className="mask">{maskCard(sc.number)}</div>
                      <div className="meta">{sc.name} · Exp {sc.exp}</div>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      aria-label="Remove saved card"
                      onClick={(e) => { e.stopPropagation(); setPendingRemove(sc); setConfirmOpen(true) }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {method === 'card' && (
            <div className="card-form">
              <div className="row">
                <label className="form-label" htmlFor="cc_name">Name on card</label>
                <input
                  id="cc_name"
                  className="form-control"
                  placeholder="Full name"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                />
              </div>

              <div className="row">
                <label className="form-label" htmlFor="cc_number">Card number</label>
              <div className="with-brand">
                <input
                  id="cc_number"
                  className="form-control"
                  placeholder="1234 5678 9101 1121"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                />
                {(() => {
                  const brand = detectBrand(card.number)
                  if (brand === 'visa') {
                    return <img src="/icons/visa_inc_logo.png" alt="Visa" className="brand-img small" />
                  }
                  if (brand === 'mastercard') {
                    return <img src="/icons/master_card_logo.png" alt="Mastercard" className="brand-img small" />
                  }
                  return null
                })()}
              </div>
            </div>

              <div className="grid-2">
                <div>
                  <label className="form-label" htmlFor="cc_exp">Expire date</label>
                  <input
                    id="cc_exp"
                    className={`form-control ${errors.exp ? 'error' : ''}`}
                    placeholder="MM/YYYY"
                    inputMode="numeric"
                    maxLength={7}
                    value={card.exp}
                    onChange={(e) => {
                      const formatted = formatExp(e.target.value)
                      setCard({ ...card, exp: formatted })
                      // live feedback when enough characters entered
                      setErrors((prev) => ({
                        ...prev,
                        exp: formatted.length === 7 && !isValidExp(formatted) ? 'Enter a valid MM/YYYY (not in the past)' : ''
                      }))
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        exp: card.exp && !isValidExp(card.exp) ? 'Enter a valid MM/YYYY (not in the past)' : ''
                      }))
                    }}
                    aria-invalid={!!errors.exp}
                  />
                  {errors.exp && <div className="error-text" role="alert">{errors.exp}</div>}
                </div>
                <div>
                  <label className="form-label" htmlFor="cc_cvv">CVV</label>
                  <input
                    id="cc_cvv"
                    className={`form-control ${errors.cvv ? 'error' : ''}`}
                    placeholder="CVV"
                    inputMode="numeric"
                    maxLength={3}
                    value={card.cvv}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
                      setCard({ ...card, cvv: digits })
                      setErrors((prev) => ({
                        ...prev,
                        cvv: digits.length === 3 ? '' : 'CVV must be 3 digits'
                      }))
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        cvv: card.cvv && !isValidCvv(card.cvv) ? 'CVV must be 3 digits' : ''
                      }))
                    }}
                    aria-invalid={!!errors.cvv}
                  />
                  {errors.cvv && <div className="error-text" role="alert">{errors.cvv}</div>}
                </div>
              </div>
              <div className="save-card">
                <input type="checkbox" id="save_card" checked={saveCardChecked} onChange={(e) => setSaveCardChecked(e.target.checked)} />
                <label htmlFor="save_card">Save card for future use</label>
              </div>
            </div>
          )}
          

          <button
            className="pay-btn"
            disabled={!(isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim())}
            aria-disabled={!(isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim())}
            onClick={handlePay}
          >
            Pay {format(total)}
          </button>

          {confirmOpen && (
            <div className="modal-backdrop" onClick={cancelRemove}>
              <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="confirm-title">Remove saved card?</h3>
                <p>
                  {pendingRemove ? `${pendingRemove.name} · ${maskCard(pendingRemove.number)} · Exp ${pendingRemove.exp}` : ''}
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={cancelRemove}>Cancel</button>
                  <button type="button" className="btn-danger" onClick={confirmRemove}>Remove</button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right: Order Summary */}
        <aside className="summary-card">
          <h2 className="summary-title">Order Summary</h2>
          <p className="summary-sub">Make sure your order information is correct</p>

          {/* Items (preview first 2, expandable) */}
          <div className={`items-list ${showAllItems ? 'scroll' : ''}`}>
            {(showAllItems ? items : items.slice(0, 2)).map((it) => (
              <div className="item" key={it.id}>
                <div className="thumb">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.title} />
                  ) : (
                    <span role="img" aria-label="package">📦</span>
                  )}
                </div>
                <div className="item-info">
                  <div className="item-title">{it.title}</div>
                  <div className="qty">
                    <span className="qty-num">{it.qty}</span>
                  </div>
                </div>
                <div className="price">{format(it.price * it.qty)}</div>
              </div>
            ))}
            {items.length > 2 && !showAllItems && (
              <button
                type="button"
                className="items-more"
                onClick={() => setShowAllItems(true)}
                aria-label={`Show ${items.length - 2} more items`}
              >
                + {items.length - 2} more
              </button>
            )}
            {items.length > 2 && showAllItems && (
              <button
                type="button"
                className="items-more"
                onClick={() => setShowAllItems(false)}
                aria-label="Show fewer items"
              >
                Show less
              </button>
            )}
          </div>

          {/* Optional Shipping Details (view + edit) */}
          <div className="shipping-block">
            <div className="block-top">
              <span className="block-title">Shipping Details</span>
              <button className="link-btn" onClick={() => setEditingShip((v) => !v)}>
                {editingShip ? 'Close' : 'Edit'}
              </button>
            </div>
            {!editingShip ? (
              <div className="ship-view">
                <div><span className="field-label">Email:</span> <span className="field-value">{email}</span></div>
                <div><span className="field-label">Recipient:</span> <span className="field-value">{shipping.name}</span></div>
                <div><span className="field-label">Address:</span> <span className="field-value">{shipping.address}</span></div>
                <div><span className="field-label">City:</span> <span className="field-value">{shipping.city}</span></div>
                <div><span className="field-label">Province:</span> <span className="field-value">{shipping.province}</span></div>
                <div><span className="field-label">Postal code:</span> <span className="field-value">{shipping.postal_code}</span></div>
                {shipping.phone_number && (
                  <div><span className="field-label">Phone:</span> <span className="field-value">{shipping.phone_number}</span></div>
                )}
              </div>
            ) : (
              <div className="ship-edit">
                <input
                  className="form-control"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="form-control"
                  placeholder="Recipient name"
                  autoComplete="name"
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                />
                <input
                  className="form-control"
                  placeholder="Street and number"
                  autoComplete="street-address"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                />
                <input
                  className="form-control"
                  placeholder="City"
                  autoComplete="address-level2"
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />
                <div className="grid-2">
                  <input
                    className="form-control"
                    placeholder="Province"
                    autoComplete="address-level1"
                    value={shipping.province}
                    onChange={(e) => setShipping({ ...shipping, province: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Postal code"
                    autoComplete="postal-code"
                    value={shipping.postal_code}
                    onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })}
                  />
                </div>
                <input
                  className="form-control"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Phone number"
                  value={shipping.phone_number}
                  onChange={(e) => setShipping({ ...shipping, phone_number: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="rowline">
              <span>Subtotal:</span>
              <span>{format(subtotal)}</span>
            </div>
            <div className="rowline">
              <span>Shipping:</span>
              <span className="free">FREE</span>
            </div>
            <div className="rowline">
              <span>Tax:</span>
              <span>{format(tax)}</span>
            </div>
            <div className="rowline total">
              <span>Total:</span>
              <span className="grand">{format(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}