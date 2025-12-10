import React, { useMemo, useState, useEffect } from 'react'
import './Checkout.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/for_cart/CartContext.jsx'
import useFetchMyShippingDetails from '../../hooks/useFetchMyShippingDetails.js'
import useCreatePaymentIntent from '../../hooks/payment/useCreatePaymentIntent.js'
import useConfirmPaymentIntent from '../../hooks/payment/useConfirmPaymentIntent.js'
import useShippingReuseOptions from '../../hooks/payment/useShippingReuseOptions.js'
import useSavedPaymentCards from '../../hooks/payment/useSavedPaymentCards.js'
import useUpdateOrderShipping from '../../hooks/useUpdateOrderShipping.js'
import SuccessModal from '../../components/modals/success_modal/SuccessModal.jsx'

// Currency formatter (Rand)
const format = (n) => `R${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items: cartItems, refresh, hydrate, clearCart } = useCart();
  const { items: shippingItems, loading: shippingLoading } = useFetchMyShippingDetails({ enabled: true });
  const { update: updateOrderShipping } = useUpdateOrderShipping();

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
  const { saveCard, removeCard } = useSavedPaymentCards()
  const confirmRemove = async () => {
    try {
      if (pendingRemove?.backend_id) {
        await removeCard({ id: pendingRemove.backend_id })
      }
    } catch (_) {}
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
  
  const handlePay = () => {
    const ready = isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim()
    const orderId = Number(location?.state?.orderId || 0)
    if (!ready || !orderId) return
    const run = async () => {
      try {
        setPaying(true)
        const intentRes = await createPaymentIntent({ orderId })
        const intentId = String(intentRes?.payment_intent_id || '')
        if (!intentId) throw new Error('Missing payment_intent_id')
        await confirmPaymentIntent({ orderId, paymentIntentId: intentId })
        try {
          await updateOrderShipping(orderId, {
            name: String(shipping.name || ''),
            address: String(shipping.address || ''),
            city: String(shipping.city || ''),
            province: String(shipping.province || ''),
            postal_code: String(shipping.postal_code || ''),
            phone_number: String(shipping.phone_number || '')
          })
        } catch (_) {}
        if (saveCardChecked) {
          try {
            const brand = detectBrand(card.number)
            const digits = card.number.replace(/\D/g, '')
            const saved = await saveCard({
              brand,
              card_number: digits,
              exp: card.exp,
              cardholder_name: card.name.trim(),
            })
            if (saved && saved.id) {
              const entryId = `c_${Date.now()}`
              const entry = { id: entryId, backend_id: saved.id, brand, name: card.name.trim(), number: card.number.replace(/\s+/g, ' ').trim(), exp: card.exp }
              setSavedCards((prev) => {
                const last4 = digits.slice(-4)
                const exists = prev.some((c) => c.number.replace(/\D/g, '').slice(-4) === last4 && c.name === entry.name && c.exp === entry.exp)
                const next = exists ? prev : [...prev, entry]
                persistSavedCards(next)
                return next
              })
            }
          } catch (_) {}
        }
        setPaying(false)
        setPaymentDone(true)
        setModalVariant('success')
        setModalMessage(`Payment successful. Order #${orderId} is now paid.`)
        try { clearCart() } catch {}
        try { window && window.dispatchEvent && window.dispatchEvent(new Event('cart:refresh')) } catch {}
        try { await refresh() } catch {}
        setModalOpen(true)
      } catch (_) {
        setPaying(false)
        setPaymentDone(false)
        setModalVariant('error')
        setModalMessage('Payment failed. Please try again.')
        setModalOpen(true)
      }
    }
    run()
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
  const { fetchReuseOptions, items: reuseItems, loading: reuseLoading } = useShippingReuseOptions()
  const [reuseOpen, setReuseOpen] = useState(false)

  // Prefer shipping from navigation state when continuing checkout
  useEffect(() => {
    const s = location?.state?.shipping
    if (s && typeof s === 'object') {
      setShipping((prev) => ({
        name: s.name || prev.name,
        address: s.address || prev.address,
        city: s.city || prev.city,
        province: s.province || prev.province,
        postal_code: s.postal_code || prev.postal_code,
        phone_number: s.phone_number || prev.phone_number,
      }))
    }
  }, [location?.state?.shipping])

  useEffect(() => {
    fetchReuseOptions().catch(() => {})
  }, [fetchReuseOptions])

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

  const { createPaymentIntent, loading: creatingIntent } = useCreatePaymentIntent()
  const { confirmPaymentIntent, loading: confirmingIntent } = useConfirmPaymentIntent()
  const [paying, setPaying] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalVariant, setModalVariant] = useState('success')
  const [modalMessage, setModalMessage] = useState('')
  const [initialSkeleton, setInitialSkeleton] = useState(true)

  useEffect(() => {
    if (!reuseLoading && !shippingLoading) {
      const t = setTimeout(() => setInitialSkeleton(false), 450)
      return () => clearTimeout(t)
    } else {
      setInitialSkeleton(true)
    }
  }, [reuseLoading, shippingLoading])

  return (
    <div className="checkout__page">
      <div className="checkout__grid">
        {/* Left: Payment */}
        <section className={`checkout__pay-card ${initialSkeleton ? 'checkout__is-skeleton' : ''}`}>
          {initialSkeleton && (
            <div className="checkout__skeleton-wrap" aria-hidden="true">
              <div className="checkout__skeleton-line checkout__skeleton-title" />
              <div className="checkout__skeleton-line checkout__skeleton-text" />
              <div className="checkout__skeleton-line checkout__skeleton-chip" />
              <div className="checkout__saved-cards">
                <div className="checkout__skeleton-line checkout__skeleton-text" />
                <div className="checkout__saved-list">
                  {[0,1].map((i) => (
                    <div key={i} className="checkout__skeleton-card" />
                  ))}
                </div>
              </div>
              <div className="checkout__card-form">
                <div className="checkout__row"><div className="checkout__skeleton-line checkout__skeleton-text" /></div>
                <div className="checkout__row"><div className="checkout__skeleton-line checkout__skeleton-text" /></div>
                <div className="checkout__grid-2">
                  <div className="checkout__row"><div className="checkout__skeleton-line checkout__skeleton-text" /></div>
                  <div className="checkout__row"><div className="checkout__skeleton-line checkout__skeleton-text" /></div>
                </div>
              </div>
              <div className="checkout__skeleton-btn checkout__skeleton-pay" />
            </div>
          )}
          <h1 className="checkout__title">Payment</h1>
          <p className="checkout__sub">Select Payment Method</p>
          {/* Credit card option + form */}
          <label className={`checkout__method-option ${method === 'card' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymethod"
              value="card"
              checked={method === 'card'}
              onChange={(e) => setMethod(e.target.value)}
            />
            <div className="checkout__method-content">
              <span className="checkout__method-title">Credit Card</span>
              <div className="checkout__brandrow" aria-label="Accepted cards">
                <img src="/icons/visa_inc_logo.png" alt="Visa" className="checkout__brand-img visa" />
                <img src="/icons/master_card_logo.png" alt="Mastercard" className="checkout__brand-img mc" />
              </div>
            </div>
          </label>

          {/* Saved card options */}
          <div className="checkout__saved-cards" aria-label="Saved cards">
            <div className="checkout__saved-title">Saved Cards</div>
            {savedCards.length === 0 ? (
              <div className="checkout__saved-empty" role="status" aria-live="polite">No previous card was saved</div>
            ) : (
              <div className="checkout__saved-list">
                {savedCards.map((sc) => (
                  <div
                    key={sc.id}
                    className={`checkout__saved-card ${selectedSaved === sc.id ? 'selected' : ''}`}
                    onClick={() => applySavedCard(sc)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedSaved === sc.id}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySavedCard(sc) }}
                  >
                    <img
                      src={sc.brand === 'visa' ? '/icons/visa_inc_logo.png' : '/icons/master_card_logo.png'}
                      alt={sc.brand === 'visa' ? 'Visa' : 'Mastercard'}
                      className="checkout__brand-img"
                    />
                    <div className="checkout__saved-meta">
                      <div className="checkout__mask">{maskCard(sc.number)}</div>
                      <div className="checkout__meta">{sc.name} · Exp {sc.exp}</div>
                    </div>
                    <button
                      type="button"
                      className="checkout__remove-btn"
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
            <div className="checkout__card-form">
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

              <div className="checkout__row">
                <label className="form-label" htmlFor="cc_number">Card number</label>
              <div className="checkout__with-brand">
                <input
                  id="cc_number"
                  className="form-control"
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 19)
                    const grouped = digits.match(/.{1,4}/g)?.join(' ') || digits
                    setCard({ ...card, number: grouped })
                  }}
                />
                {(() => {
                  const brand = detectBrand(card.number)
                  if (brand === 'visa') {
                    return <img src="/icons/visa_inc_logo.png" alt="Visa" className="checkout__brand-img small" />
                  }
                  if (brand === 'mastercard') {
                    return <img src="/icons/master_card_logo.png" alt="Mastercard" className="checkout__brand-img small" />
                  }
                  return null
                })()}
              </div>
            </div>

              <div className="checkout__grid-2">
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
                  {errors.exp && <div className="checkout__error-text" role="alert">{errors.exp}</div>}
                </div>
                <div>
                  <label className="form-label" htmlFor="cc_cvv">CVV</label>
                  <input
                    id="cc_cvv"
                    className={`form-control ${errors.cvv ? 'error' : ''}`}
                    placeholder="CVV"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
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
                  {errors.cvv && <div className="checkout__error-text" role="alert">{errors.cvv}</div>}
                </div>
              </div>
              <div className="checkout__save-card">
                <input type="checkbox" id="save_card" checked={saveCardChecked} onChange={(e) => setSaveCardChecked(e.target.checked)} />
                <label htmlFor="save_card">Save card for future use</label>
              </div>
            </div>
          )}
          

          <button
            className="checkout__pay-btn"
            disabled={!(isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim()) || paying || creatingIntent || confirmingIntent || !Number(location?.state?.orderId || 0)}
            aria-disabled={!(isValidExp(card.exp) && isValidCvv(card.cvv) && card.name.trim() && card.number.trim()) || paying || creatingIntent || confirmingIntent || !Number(location?.state?.orderId || 0)}
            onClick={handlePay}
          >
            {paying || creatingIntent || confirmingIntent ? 'Processing…' : (paymentDone ? 'Paid' : `Pay ${format(total)}`)}
          </button>

          <SuccessModal
            open={modalOpen}
            variant={modalVariant}
            title={modalVariant === 'success' ? 'Payment Successful' : 'Payment Failed'}
            message={modalMessage}
            onClose={() => setModalOpen(false)}
            onAfterClose={() => {
              setModalOpen(false);
              if (modalVariant === 'success') {
                navigate('/account', { state: { active: 'orders' } });
              } else {
                navigate('/cart');
              }
            }}
            autoCloseMs={6000}
            closeOnOverlay={true}
          />

          {confirmOpen && (
            <div className="checkout__modal-backdrop" onClick={cancelRemove}>
              <div
                className="checkout__modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="confirm-title">Remove saved card?</h3>
                <p>
                  {pendingRemove ? `${pendingRemove.name} · ${maskCard(pendingRemove.number)} · Exp ${pendingRemove.exp}` : ''}
                </p>
                <div className="checkout__modal-actions">
                  <button type="button" className="checkout__btn-cancel" onClick={cancelRemove}>Cancel</button>
                  <button type="button" className="checkout__btn-danger" onClick={confirmRemove}>Remove</button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right: Order Summary */}
        <aside className={`checkout__summary-card ${initialSkeleton ? 'checkout__is-skeleton' : ''}`}>
          {initialSkeleton && (
            <div className="checkout__skeleton-wrap" aria-hidden="true">
              <div className="checkout__skeleton-line checkout__skeleton-title" />
              <div className="checkout__skeleton-line checkout__skeleton-text" />
              <div className="checkout__items-list">
                {[0,1,2].map((i) => (
                  <div key={i} className="checkout__item">
                    <div className="checkout__thumb"><div className="checkout__skeleton-thumb" /></div>
                    <div className="checkout__item-info" style={{ width: '100%' }}>
                      <div className="checkout__skeleton-line checkout__skeleton-text" />
                      <div className="checkout__qty"><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
                    </div>
                    <div className="checkout__price"><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
                  </div>
                ))}
              </div>
              <div className="checkout__shipping-block">
                <div className="checkout__saved-shipping">
                  <div className="checkout__skeleton-line checkout__skeleton-text" />
                  <div className="checkout__saved-list">
                    {[0,1,2].map((i) => (<div key={i} className="checkout__skeleton-chip" />))}
                  </div>
                </div>
                <div className="checkout__ship-view">
                  {[0,1,2,3,4,5].map((i) => (<div key={i} className="checkout__skeleton-line checkout__skeleton-text" />))}
                </div>
              </div>
              <div className="checkout__totals">
                <div className="checkout__rowline"><div className="checkout__skeleton-line checkout__skeleton-text" /><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
                <div className="checkout__rowline"><div className="checkout__skeleton-line checkout__skeleton-text" /><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
                <div className="checkout__rowline"><div className="checkout__skeleton-line checkout__skeleton-text" /><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
                <div className="checkout__rowline checkout__rowline--total"><div className="checkout__skeleton-line checkout__skeleton-text" /><div className="checkout__skeleton-line checkout__skeleton-chip" /></div>
              </div>
            </div>
          )}
          <h2 className="checkout__summary-title">Order Summary</h2>
          <p className="checkout__summary-sub">Make sure your order information is correct</p>

          {/* Items (preview first 2, expandable) */}
          <div className={`checkout__items-list ${showAllItems ? 'scroll' : ''}`}>
            {(showAllItems ? items : items.slice(0, 2)).map((it) => (
              <div className="checkout__item" key={it.id}>
                <div className="checkout__thumb">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.title} />
                  ) : (
                    <span role="img" aria-label="package">📦</span>
                  )}
                </div>
                <div className="checkout__item-info">
                  <div className="checkout__item-title">{it.title}</div>
                  <div className="checkout__qty">
                    <span className="checkout__qty-num">{it.qty}</span>
                  </div>
                </div>
                <div className="checkout__price">{format(it.price * it.qty)}</div>
              </div>
            ))}
            {items.length > 2 && !showAllItems && (
              <button
                type="button"
                className="checkout__items-more"
                onClick={() => setShowAllItems(true)}
                aria-label={`Show ${items.length - 2} more items`}
              >
                + {items.length - 2} more
              </button>
            )}
            {items.length > 2 && showAllItems && (
              <button
                type="button"
                className="checkout__items-more"
                onClick={() => setShowAllItems(false)}
                aria-label="Show fewer items"
              >
                Show less
              </button>
            )}
          </div>

          {/* Optional Shipping Details (view + edit) */}
          <div className="checkout__shipping-block">
            {(Array.isArray(reuseItems) && reuseItems.length > 0) && (
              <div className={`checkout__saved-shipping ${reuseOpen ? 'open' : ''}`}>
                <div className="checkout__saved-title">Saved Addresses</div>
                <div className={`checkout__saved-list ${reuseOpen ? 'checkout__saved-list--slider' : ''}`}>
                  {(reuseOpen ? reuseItems : reuseItems.slice(0, 3)).map((r, idx) => (
                    <button
                      key={`${r.city || ''}-${r.province || ''}-${r.postal_code || ''}-${idx}`}
                      type="button"
                      className="checkout__saved-chip"
                      onClick={() => {
                        setShipping((prev) => ({
                          ...prev,
                          address: r.address || prev.address || '',
                          city: r.city || prev.city || '',
                          province: r.province || prev.province || '',
                          postal_code: r.postal_code || prev.postal_code || '',
                          phone_number: r.phone_number || prev.phone_number || ''
                        }))
                        setReuseOpen(false)
                      }}
                    >
                      <span className="checkout__chip-title">{[r.city, r.province, r.postal_code].filter(Boolean).join(', ')}</span>
                      <span className="checkout__chip-sub">{[r.address, r.phone_number].filter(Boolean).join(' · ')}</span>
                    </button>
                  ))}
                </div>
                {reuseItems.length > 3 && !reuseOpen && (
                  <button type="button" className="checkout__items-more" onClick={() => setReuseOpen(true)}>
                    + {reuseItems.length - 3} more
                  </button>
                )}
                {reuseOpen && (
                  <button type="button" className="checkout__items-more" onClick={() => setReuseOpen(false)}>
                    Close
                  </button>
                )}
              </div>
            )}
            <div className="checkout__block-top">
              <span className="checkout__block-title">Shipping Details</span>
              <button className="checkout__link-btn" onClick={() => setEditingShip((v) => !v)}>
                {editingShip ? 'Close' : 'Edit'}
              </button>
            </div>
            {!editingShip ? (
              <div className="checkout__ship-view">
                <div><span className="checkout__field-label">Email:</span> <span className="checkout__field-value">{email}</span></div>
                <div><span className="checkout__field-label">Recipient:</span> <span className="checkout__field-value">{shipping.name}</span></div>
                <div><span className="checkout__field-label">Address:</span> <span className="checkout__field-value">{shipping.address}</span></div>
                <div><span className="checkout__field-label">City:</span> <span className="checkout__field-value">{shipping.city}</span></div>
                <div><span className="checkout__field-label">Province:</span> <span className="checkout__field-value">{shipping.province}</span></div>
                <div><span className="checkout__field-label">Postal code:</span> <span className="checkout__field-value">{shipping.postal_code}</span></div>
                {shipping.phone_number && (
                  <div><span className="checkout__field-label">Phone:</span> <span className="checkout__field-value">{shipping.phone_number}</span></div>
                )}
              </div>
            ) : (
              <div className="checkout__ship-edit">
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
                <div className="checkout__grid-2">
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
                  onChange={(e) => {
                    const v = e.target.value
                    const cleaned = v
                      .replace(/[^\d+\s-]/g, '')
                      .replace(/(?!^)\+/g, '')
                      .slice(0, 20)
                    setShipping({ ...shipping, phone_number: cleaned })
                  }}
                />
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="checkout__totals">
            <div className="checkout__rowline">
              <span>Subtotal:</span>
              <span>{format(subtotal)}</span>
            </div>
            <div className="checkout__rowline">
              <span>Shipping:</span>
              <span className="checkout__free">FREE</span>
            </div>
            <div className="checkout__rowline">
              <span>Tax:</span>
              <span>{format(tax)}</span>
            </div>
            <div className="checkout__rowline checkout__rowline--total">
              <span>Total:</span>
              <span className="checkout__grand">{format(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
