import React from 'react';
import './AdminDashboard.css';
import useFetchMe from '../../../hooks/useFetchMe.js';

const ph = '/images/imageNoVnXXmDNi0.png';

export default function AdminDashboard() {
  const { data } = useFetchMe();
  const name = data?.name ? data.name.split(' ')[0] : 'Admin';

  return (
    <div className="admin_dashboard__page">
      <div className="admin_dashboard__panel">
        <aside className="admin_dashboard__rail" aria-label="Admin shortcuts">
          <button className="admin_dashboard__rail_btn admin_dashboard__rail_btn--active" aria-label="Dashboard" />
          <button className="admin_dashboard__rail_btn" aria-label="Products" />
          <button className="admin_dashboard__rail_btn" aria-label="Orders" />
          <button className="admin_dashboard__rail_btn" aria-label="Customers" />
        </aside>
        <div className="admin_dashboard__content">
          <div className="admin_dashboard__header">
            <h1 className="admin_dashboard__greeting">Hello, <span className="admin_dashboard__greeting_accent">{name}</span>!</h1>
            <div className="admin_dashboard__header_right">
              <div className="admin_dashboard__search">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="admin_dashboard__search_input" placeholder="Search inventory" aria-label="Search" />
              </div>
              <div className="admin_dashboard__header_actions">
                <button className="admin_dashboard__icon_btn" aria-label="Notifications" />
                <button className="admin_dashboard__icon_btn" aria-label="Profile" />
              </div>
            </div>
          </div>

          <div className="admin_dashboard__top">
            <div className="admin_dashboard__hero">
              <div className="admin_dashboard__badge">New Drop</div>
              <div className="admin_dashboard__hero_title">Turn Heads with Clementine</div>
              <div className="admin_dashboard__hero_sub">Bold, confident apparel crafted for everyday style. Discover this week’s featured pieces.</div>
              <button className="admin_dashboard__hero_cta" aria-label="View collection">View</button>
              <img src={ph} alt="Featured collection" className="admin_dashboard__hero_img" />
            </div>
            <div className="admin_dashboard__list">
              <div className="admin_dashboard__list_header">
                <span className="admin_dashboard__list_title">Top Categories</span>
                <button className="admin_dashboard__see_more" aria-label="See more">See More</button>
              </div>
              <ul className="admin_dashboard__chips" aria-label="Top categories">
                {[
                  { n: 'Outerwear', m: '1.2k Items' },
                  { n: 'Dresses', m: '980 Items' },
                  { n: 'Denim', m: '860 Items' },
                  { n: 'Basics', m: '1.6k Items' },
                  { n: 'Footwear', m: '740 Items' },
                  { n: 'Accessories', m: '520 Items' },
                ].map((c) => (
                  <li key={c.n} className="admin_dashboard__chip">
                    <img src={ph} alt="" className="admin_dashboard__chip_avatar" />
                    <div className="admin_dashboard__chip_text">
                      <span className="admin_dashboard__chip_name">{c.n}</span>
                      <span className="admin_dashboard__chip_meta">{c.m}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="admin_dashboard__section_row">
            <div className="admin_dashboard__section_label">Collection Highlights</div>
            <button className="admin_dashboard__see_more" aria-label="See more">See More</button>
          </div>
          <div className="admin_dashboard__grid">
            {[
              { t: 'Aurora Jacket', s: 'Outerwear' },
              { t: 'Fame Satin Dress', s: 'Dresses' },
              { t: 'Midnight Denim', s: 'Denim' },
              { t: 'Carter Boots', s: 'Footwear' },
            ].map((p) => (
              <div key={p.t} className="admin_dashboard__card">
                <img src={ph} alt="" className="admin_dashboard__card_img" />
                <div className="admin_dashboard__card_body">
                  <div className="admin_dashboard__card_title">{p.t}</div>
                  <div className="admin_dashboard__card_sub">{p.s}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin_dashboard__bar" aria-label="Quick actions">
            <div className="admin_dashboard__bar_left">
              <img src={ph} alt="" className="admin_dashboard__bar_avatar" />
              <div className="admin_dashboard__bar_texts">
                <div className="admin_dashboard__bar_title">Inventory Update</div>
                <div className="admin_dashboard__bar_sub">Sync stock and review low‑inventory alerts</div>
              </div>
            </div>
            <div className="admin_dashboard__bar_controls">
              <button className="admin_dashboard__bar_btn" aria-label="Play" />
              <button className="admin_dashboard__bar_btn" aria-label="Prev" />
              <button className="admin_dashboard__bar_btn" aria-label="Next" />
            </div>
            <div className="admin_dashboard__bar_progress">
              <div className="admin_dashboard__bar_track">
                <div className="admin_dashboard__bar_fill" style={{ width: '40%' }} />
              </div>
              <div className="admin_dashboard__bar_meta">1:25 / 3:12</div>
            </div>
            <div className="admin_dashboard__bar_actions">
              <button className="admin_dashboard__bar_icon" aria-label="Favorite" />
              <button className="admin_dashboard__bar_icon" aria-label="Repeat" />
              <button className="admin_dashboard__bar_icon" aria-label="Queue" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

