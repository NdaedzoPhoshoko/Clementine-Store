import React from "react";
import "./navbar.css";

const Navbar = () => {
  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      <div className="nav-bar__inner">
        <div className="nav-left">
          <a href="#" className="nav-brand" aria-label="Home">
            <span className="nav-brand__text">Clementine</span>
          </a>
        </div>

        <div className="nav-center">
          <div className="nav-search">
            <input
              type="text"
              className="nav-search__input"
              placeholder="What are you looking for?"
              aria-label="Search"
            />
            <button className="nav-search__btn" aria-label="Search">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          <nav className="nav-links" aria-label="Secondary navigation">
            <div className="nav-item">
              <a href="#home">
                Home
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </a>
              <div className="nav-mega" role="menu" aria-label="Home menu">
                <div className="mega-left">
                  <h4>Start Here</h4>
                  <p>Explore highlights from across the store: seasonal picks, editor‑curated collections, and what shoppers are loving right now. This is the quickest way to discover themes, styles, and best‑selling products without needing to search.</p>
                </div>
                <div className="mega-right">
                  <a href="#trending" className="mega-tag">Trending Now
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Trending Now" className="mega-tag__img" />
                  </a>
                  <a href="#new-arrivals" className="mega-tag">New Arrivals
                    <img src="/images/imageNoVnXXmDNi0.png" alt="New Arrivals" className="mega-tag__img" />
                  </a>
                  <a href="#featured" className="mega-tag">Featured Collections
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Featured Collections" className="mega-tag__img" />
                  </a>
                  <a href="#top-rated" className="mega-tag">Top Rated
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Top Rated" className="mega-tag__img" />
                  </a>
                  <a href="#weekly-deals" className="mega-tag">Weekly Deals
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Weekly Deals" className="mega-tag__img" />
                  </a>
                  <a href="#gift-ideas" className="mega-tag">Gift Ideas
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Gift Ideas" className="mega-tag__img" />
                  </a>
                </div>
              </div>
            </div>

            <div className="nav-item">
              <a href="#all">
                Shop All
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </a>
              <div className="nav-mega" role="menu" aria-label="Shop All menu">
                <div className="mega-left">
                  <h4>All Categories</h4>
                  <p>Browse our complete catalog across departments and collections. Use categories to narrow your search and jump straight to the products and styles that match your taste, budget, and occasion.</p>
                </div>
                <div className="mega-right">
                  <a href="#women" className="mega-tag">Women
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Women" className="mega-tag__img" />
                  </a>
                  <a href="#men" className="mega-tag">Men
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Men" className="mega-tag__img" />
                  </a>
                  <a href="#kids" className="mega-tag">Kids
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Kids" className="mega-tag__img" />
                  </a>
                  <a href="#accessories" className="mega-tag">Accessories
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Accessories" className="mega-tag__img" />
                  </a>
                  <a href="#beauty" className="mega-tag">Beauty
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Beauty" className="mega-tag__img" />
                  </a>
                  <a href="#home-living" className="mega-tag">Home & Living
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Home & Living" className="mega-tag__img" />
                  </a>
                </div>
              </div>
            </div>

            <div className="nav-item">
              <a href="#us">
                About Us
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </a>
              <div className="nav-mega" role="menu" aria-label="About Us menu">
                <div className="mega-left">
                  <h4>Our Story</h4>
                  <p>We craft quality products with care and purpose. Learn about our mission, the team behind Clementine, and the practices that guide our design, sourcing, and sustainability commitments.</p>
                </div>
                <div className="mega-right">
                  <a href="#mission" className="mega-tag">Mission
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Mission" className="mega-tag__img" />
                  </a>
                  <a href="#team" className="mega-tag">Team
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Team" className="mega-tag__img" />
                  </a>
                  <a href="#sustainability" className="mega-tag">Sustainability
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Sustainability" className="mega-tag__img" />
                  </a>
                  <a href="#careers" className="mega-tag">Careers
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Careers" className="mega-tag__img" />
                  </a>
                  <a href="#press" className="mega-tag">Press
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Press" className="mega-tag__img" />
                  </a>
                  <a href="#contact" className="mega-tag">Contact
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Contact" className="mega-tag__img" />
                  </a>
                </div>
              </div>
            </div>

            <div className="nav-item">
              <a href="#support">
                Support
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </a>
              <div className="nav-mega" role="menu" aria-label="Support menu">
                <div className="mega-left">
                  <h4>Help Center</h4>
                  <p>Get help with orders, shipping, returns, and account questions. Find quick answers, track your order status, or reach our support team for personalized assistance when you need it.</p>
                </div>
                <div className="mega-right">
                  <a href="#faq" className="mega-tag">FAQ
                    <img src="/images/imageNoVnXXmDNi0.png" alt="FAQ" className="mega-tag__img" />
                  </a>
                  <a href="#shipping" className="mega-tag">Shipping
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Shipping" className="mega-tag__img" />
                  </a>
                  <a href="#returns" className="mega-tag">Returns
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Returns" className="mega-tag__img" />
                  </a>
                  <a href="#order-status" className="mega-tag">Order Status
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Order Status" className="mega-tag__img" />
                  </a>
                  <a href="#contact-support" className="mega-tag">Contact Support
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Contact Support" className="mega-tag__img" />
                  </a>
                  <a href="#live-chat" className="mega-tag">Live Chat
                    <img src="/images/imageNoVnXXmDNi0.png" alt="Live Chat" className="mega-tag__img" />
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="nav-right">
          <a href="#account" className="nav-icon" aria-label="Account">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </a>
          <a href="#cart" className="nav-icon" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="cart-counter" aria-label="Cart items count">0</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;