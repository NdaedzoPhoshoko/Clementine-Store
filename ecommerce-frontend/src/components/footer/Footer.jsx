import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./footer.css";

const Footer = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  return (
    <>
    <footer className="site-footer" role="contentinfo" aria-label="Footer">
      <div className="footer-inner">
        <div className="footer-grid" aria-label="Footer navigation">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Home">
              <span className="footer-logo__text">Clementine</span>
            </Link>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">The Service</h4>
            <ul className="footer-links">
              <li><a href="#gift-cards" className="footer-link">Gift Cards</a></li>
              <li><a href="#plus-sizes" className="footer-link">Plus Sizes</a></li>
              <li><a href="#womens-jeans" className="footer-link">Women's Jeans</a></li>
              <li><a href="#business-casual" className="footer-link">Business Casual</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">Our Company</h4>
            <ul className="footer-links">
              <li><a href="#about" className="footer-link">About Clementine</a></li>
              <li><a href="#sustainability" className="footer-link">Sustainability &amp; Ethics</a></li>
              <li><a href="#size-fit" className="footer-link">Size &amp; Fit Guide</a></li>
              <li><a href="#careers" className="footer-link">Careers</a></li>
              <li><a href="#partners" className="footer-link">Partnerships &amp; Affiliates</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">Questions?</h4>
            <ul className="footer-links">
              <li><a href="#help" className="footer-link">Help</a></li>
              <li><a href="#returns" className="footer-link">Returns</a></li>
            </ul>
            <div className="footer-social" aria-label="Social links">
              <a href="#facebook" className="footer-social__link" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.7c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/></svg>
              </a>
              <a href="#instagram" className="footer-social__link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.3"/></svg>
              </a>
              <a href="#pinterest" className="footer-social__link" aria-label="Pinterest">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M12.2 3C7.9 3 5 5.7 5 9.2c0 2.3 1.3 4 3.1 4 .7 0 1.3-.6 1.2-1.3-.2-.8-.6-2.5-.6-3.4 0-2.5 1.6-4.3 4-4.3 1.9 0 3.2 1.1 3.2 3.1 0 3.2-1.3 5.9-3.3 5.9-1.1 0-1.9-.9-1.6-2 0 0 .4-1.3.7-2.1.3-1-.1-1.8-1.1-1.8-.9 0-1.7 1-1.7 2.4 0 .9.3 1.5.3 1.5l-1.2 5c-.4 1.6-.1 3.6 0 3.8.1.1.2.1.3 0 .1-.1 2-2.7 2.6-4.1.2-.6.9-3.4.9-3.4.5.9 1.8 1.7 3.2 1.7 2.4 0 4.3-2.6 4.3-6.3C19.4 5.7 16.6 3 12.2 3z"/></svg>
              </a>
              <a href="#x" className="footer-social__link" aria-label="X">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M17.1 3H20l-6.5 7.4L21 21h-7.9l-4.1-4.9-4.6 4.9H1l7.1-7.7L3 3h8l3.6 4.4L17.1 3Z"/></svg>
              </a>
              <a href="#tiktok" className="footer-social__link" aria-label="TikTok">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M17 6.5c1.1.9 2.6 1.5 4 1.6v3.4c-1.6-.1-3.1-.5-4.4-1.2v4.9c0 3.6-3 6.5-6.7 6.5S3.2 18.8 3.2 15.2c0-3.6 3-6.5 6.7-6.5.4 0 .7 0 1 .1v3.6c-.3-.1-.6-.2-.9-.2-1.7 0-3.1 1.3-3.1 3s1.4 3 3.1 3 3.1-1.3 3.1-3V3h3.6c.1 1.3.8 2.6 2.2 3.5Z"/></svg>
              </a>
              <a href="#youtube" className="footer-social__link" aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M23.5 6.2c-.3-1.3-1.3-2.2-2.6-2.3C18.9 3.5 12 3.5 12 3.5s-6.9 0-8.9.4C1.8 4 0.8 5 0.5 6.2 0 8.3 0 12 0 12s0 3.7.5 5.8c.3 1.3 1.3 2.3 2.6 2.5 2 .4 8.9.4 8.9.4s6.9 0 8.9-.4c1.3-.2 2.3-1.2 2.6-2.5.5-2.1.5-5.8.5-5.8s0-3.7-.5-5.8ZM9.6 15.3V8.7l6.5 3.3-6.5 3.3Z"/></svg>
              </a>
            </div>
            <a
              href="https://github.com/NdaedzoPhoshoko"
              className="footer-store-badge"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View developer profile"
            >
              View developer profile
            </a>
            
          </div>
          
          {/* New column: Map embedded, same size as other columns */}
          <div className="footer-column">
            <h4 className="footer-title">Find Us</h4>
            <div className="footer-map">
              <div className="embed-map-responsive">
                <div className="embed-map-container" aria-busy={!mapLoaded}>
                  <iframe
                    className="embed-map-frame"
                    loading="lazy"
                    title="Clementine Store location"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setMapLoaded(true)}
                    src="https://maps.google.com/maps?width=600&height=400&hl=en&q=Woodmead&t=k&z=14&ie=UTF8&iwloc=B&output=embed"
                  />
                  {!mapLoaded && (
                    <div className="embed-map-placeholder" role="status" aria-live="polite">
                      Find us at Woodmead, Sandton
                    </div>
                  )}
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Woodmead"
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                View larger map
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-trademark">
            Clementine is a trademark of Clementine Store.
          </div>
        </div>
      </div>
    </footer>

    </>
  );
};

export default Footer;
