import './Support.css'
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import faqsData from './data/faqs.json'
import useFetchOrderTrackingPublic from '../../hooks/support/useFetchOrderTrackingPublic'

function Reveal({ children, className = '', as = 'div', threshold = 0.1, ...props }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  const Component = as
  return (
    <Component ref={ref} className={`${className} ${isVisible ? 'is-visible' : ''}`} {...props}>
      {children}
    </Component>
  )
}

export default function Support() {
  const location = useLocation()
  const [open, setOpen] = useState(0)
  const faqs = faqsData.items || faqsData
  const intro = faqsData.intro || {}

  // Scroll to hash targets when navigating via /support#section
  useEffect(() => {
    if (location && location.hash) {
      const target = document.querySelector(location.hash)
      if (target) {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (e) {
          const y = target.getBoundingClientRect().top + window.scrollY
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
    }
  }, [location.hash])

  return (
    <main className="support-page" aria-labelledby="support-heading">
      <section className="support-hero" aria-label="Support hero">
        <Reveal className="left__secton">
          <div className="left-content">
            <p className="support-kicker">Support</p>
            <h1 id="support-heading" className="support-title">Frequently Asked Questions</h1>
            <p className="support-subtext">Need help? Browse common questions about orders, shipping, returns, and accounts.</p>
          </div>
        </Reveal>
        <div className="right__section">
          <img
            src="/images/website_screenshot.png"
            alt="Website screenshot"
            className="support-hero-image"
            decoding="async"
            loading="lazy"
          />
        </div>
      </section>

      <Reveal as="section" id="faqs" className="support-faqs" aria-label="General FAQs">
        <div className="faq-intro">
          <h2 className="faq-heading">General FAQs</h2>
          <p className="faq-text">{intro.text} {intro.linkHref && intro.linkText ? (<a href={intro.linkHref} className="faq-link">{intro.linkText}</a>) : null}.</p>
        </div>
        <div className="faq-list">
          {faqs.map((it, i) => {
            const expanded = open === i
            return (
              <div className="faq-item" key={i}>
                <button
                  type="button"
                  className="faq-trigger"
                  aria-expanded={expanded}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(expanded ? -1 : i)}
                >
                  <span className="faq-question">{it.question}</span>
                  <span className="faq-icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className={`faq-panel ${expanded ? 'open' : ''}`}
                  role="region"
                >
                  <p className="faq-answer">{it.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Reveal>

      <Reveal as="section" id="contact" className="support-contact" aria-label="Contact support">
        <div className="contact-intro">
          <h2 className="contact-heading">Still have more questions?</h2>
          <p className="contact-text">Populate your question in the form below. Our support team will contact you at your email address. Responses may take a few days during high inquiry periods, so please be patient.</p>
        </div>
        <ContactForm />
      </Reveal>

      <Reveal as="section" id="track" className="support-track" aria-label="Track order without signing in">
        <div className="track-intro">
          <h2 className="track-heading">Track an order</h2>
          <p className="track-text">Enter your order number to see the latest status. If there are many inquiries, updates can take time. Please be patient.</p>
        </div>
        <TrackOrder />
      </Reveal>
    </main>
  )
}

function ContactForm() {
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [subjectError, setSubjectError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [messageError, setMessageError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setSubjectError('')
    setEmailError('')
    setMessageError('')
    const s = subject.trim()
    const m = message.trim()
    const em = email.trim()
    let ok = true
    if (s.length < 6) { setSubjectError('Enter a concise title, at least 6 characters'); ok = false }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(em)) { setEmailError('Enter a valid email address'); ok = false }
    if (m.length < 16) { setMessageError('Provide more detail, at least 16 characters'); ok = false }
    if (!ok) { setStatus('error'); return }
    setStatus('success')
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-row">
        <label className="form-label" htmlFor="subject">Question title</label>
        <input
          id="subject"
          type="text"
          className={`form-control ${subjectError ? 'is-invalid' : ''}`}
          placeholder="Regarding Order #24JPT / How do I track an order without signing in?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        {subjectError && <span className="input-hint input-hint--error">{subjectError}</span>}
      </div>
      <div className="contact-row">
        <label className="form-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className={`form-control ${emailError ? 'is-invalid' : ''}`}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {emailError && <span className="input-hint input-hint--error">{emailError}</span>}
      </div>
      <div className="contact-row">
        <label className="form-label" htmlFor="message">Message</label>
        <textarea
          id="message"
          className={`form-textarea form-textarea--flat ${messageError ? 'is-invalid' : ''}`}
          placeholder="Describe your enquiry briefly. Include order number, item name, and any helpful context so we can assist quickly."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        {messageError && <span className="input-hint input-hint--error">{messageError}</span>}
      </div>
      <div className="contact-actions">
        <button type="submit" className="contact-btn">Submit</button>
        {status === 'error' && <span className="contact-status contact-status--error">Please fill in all fields.</span>}
        {status === 'success' && <span className="contact-status contact-status--success">Thanks. We’ll reach out via email soon.</span>}
      </div>
    </form>
  )
}

function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [current, setCurrent] = useState(null)
  const [validationError, setValidationError] = useState('')
  const { trackOrder, loading, error: apiError } = useFetchOrderTrackingPublic()

  const steps = [
    { key: 'pending', label: 'Pending' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivering', label: 'Delivering' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    const v = orderId.trim()
    setValidationError('')
    if (!v) { setCurrent(null); setValidationError('Enter your order number'); return }
    
    try {
      const res = await trackOrder(v)
      if (res && res.status) {
        const s = res.status.toLowerCase()
        const idx = steps.findIndex(step => step.key === s || step.label.toLowerCase() === s)
        setCurrent(idx >= 0 ? idx : 0)
      } else {
        setCurrent(null)
        setValidationError('Status info not available')
      }
    } catch (e) {
      setCurrent(null)
      // apiError will be set
    }
  }

  return (
    <div className="track-card">
      <form className="track-form" onSubmit={onSubmit} noValidate>
        <div className="track-row">
          <label className="form-label" htmlFor="orderId">Order number</label>
          <input
            id="orderId"
            type="text"
            className="form-control"
            placeholder="e.g. 1001"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="track-actions">
          <button type="submit" className="contact-btn" disabled={loading}>
            {loading ? 'Checking...' : 'Check status'}
          </button>
        </div>
        {(validationError || apiError) && <span className="input-hint input-hint--error">{validationError || apiError}</span>}
        <div className={`track-results ${Number.isInteger(current) ? 'open' : ''}`}>
          {Number.isInteger(current) && (
            <div className="status-timeline">
              {steps.map((s, i) => (
                <div key={`step-wrapper-${s.key}`} style={{ display: 'contents' }}>
                  <div className={`timeline-step ${i < current ? 'timeline-step--done' : ''} ${i === current ? 'timeline-step--current' : ''}`} key={`step-${s.key}`}>
                    <span className="timeline-node" />
                    <span className="timeline-label">{s.label}</span>
                  </div>
                  {i < steps.length - 1 ? <span className="timeline-connector" key={`con-${s.key}`} /> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
