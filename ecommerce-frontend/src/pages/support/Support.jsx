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
    </main>
  )
}

function ContactForm() {
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')

  const onSubmit = (e) => {
    e.preventDefault()
    const ok = subject.trim() && email.trim() && message.trim()
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
          className="form-control"
          placeholder="Regarding Order #24JPT / How do I track an order without signing in?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div className="contact-row">
        <label className="form-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="form-control"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="contact-row">
        <label className="form-label" htmlFor="message">Message</label>
        <textarea
          id="message"
          className="form-textarea form-textarea--flat"
          placeholder="Describe your enquiry briefly. Include order number, item name, and any helpful context so we can assist quickly."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <div className="contact-actions">
        <button type="submit" className="contact-btn">Submit</button>
        {status === 'error' && <span className="contact-status contact-status--error">Please fill in all fields.</span>}
        {status === 'success' && <span className="contact-status contact-status--success">Thanks. We’ll reach out via email soon.</span>}
      </div>
    </form>
  )
}
