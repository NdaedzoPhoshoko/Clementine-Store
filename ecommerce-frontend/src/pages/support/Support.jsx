import './Support.css'
import { useState } from 'react'
import faqsData from './data/faqs.json'

export default function Support() {
  const [open, setOpen] = useState(0)
  const faqs = faqsData.items || faqsData
  const intro = faqsData.intro || {}

  return (
    <main className="support-page" aria-labelledby="support-heading">
      <section className="support-hero" aria-label="Support hero">
        <div className="left__secton">
          <div className="left-content">
            <p className="support-kicker">Support</p>
            <h1 id="support-heading" className="support-title">Frequently Asked Questions</h1>
            <p className="support-subtext">Need help? Browse common questions about orders, shipping, returns, and accounts.</p>
          </div>
        </div>
        <div className="right__section">
          <img
            src="/images/website_screenshot.png"
            alt="Website screenshot"
            className="support-hero-image"
            decoding="async"
            loading="eager"
          />
        </div>
      </section>

      <section className="support-faqs" aria-label="General FAQs">
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
      </section>

      <section className="support-contact" aria-label="Contact support">
        <div className="contact-intro">
          <h2 className="contact-heading">Still have more questions?</h2>
          <p className="contact-text">Populate your question in the form below. Our support team will contact you at your email address. Responses may take a few days during high inquiry periods, so please be patient.</p>
        </div>
        <ContactForm />
      </section>

      <section className="support-track" aria-label="Track order without signing in">
        <div className="track-intro">
          <h2 className="track-heading">Track an order</h2>
          <p className="track-text">Enter your order number to see the latest status. If there are many inquiries, updates can take time. Please be patient.</p>
        </div>
        <TrackOrder />
      </section>
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
  const [error, setError] = useState('')

  const steps = [
    { key: 'pending', label: 'Pending' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivering', label: 'Delivering' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const onSubmit = (e) => {
    e.preventDefault()
    const v = orderId.trim()
    setError('')
    if (!v) { setCurrent(null); setError('Enter your order number'); return }
    const code = v.toUpperCase()
    const hash = Array.from(code).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const idx = Math.min(steps.length - 1, Math.max(0, hash % steps.length))
    setCurrent(idx)
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
            placeholder="e.g. 24JPT"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
        </div>
        <div className="track-actions">
          <button type="submit" className="contact-btn">Check status</button>
        </div>
        {error && <span className="input-hint input-hint--error">{error}</span>}
        <div className={`track-results ${Number.isInteger(current) ? 'open' : ''}`}>
          {Number.isInteger(current) && (
            <div className="status-timeline">
              {steps.map((s, i) => (
                <>
                  <div className={`timeline-step ${i < current ? 'timeline-step--done' : ''} ${i === current ? 'timeline-step--current' : ''}`} key={`step-${s.key}`}>
                    <span className="timeline-node" />
                    <span className="timeline-label">{s.label}</span>
                  </div>
                  {i < steps.length - 1 ? <span className="timeline-connector" key={`con-${s.key}`} /> : null}
                </>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
