import React, { useState, useEffect, useRef } from 'react';
import './Reviews.css';
import { Star, Search, Filter, ChevronDown, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import useFetchAllReviews from '../../../../../hooks/admin_dashboard/reviews/useFetchAllReviews';

export default function Reviews() {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);
  
  // Filter States
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { reviews, meta, stats, loading, error } = useFetchAllReviews({
    page,
    limit: 10,
    search: debouncedSearch,
    rating: ratingFilter,
    sortBy,
    sortOrder,
    startDate,
    endDate
  });

  const handleSortToggle = () => {
    setPage(1);
    if (sortBy === 'created_at') {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy('created_at');
      setSortOrder('desc');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const renderStars = (rating) => {
    return (
      <div className="reviews-page__stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={16} 
            className={s <= rating ? "star-filled" : "star-empty"} 
            fill={s <= rating ? "#FFB400" : "none"}
            color={s <= rating ? "#FFB400" : "#D1D5DB"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  if (loading && !reviews.length) {
    return <div className="reviews-page__loading">Loading reviews...</div>;
  }

  // Use stats from backend or fallbacks
  const totalReviews = stats?.total || 0;
  const averageRating = stats?.average || 0;
  const distribution = stats?.distribution || [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  return (
    <div className="reviews-page">
      {/* Top Stats Section */}
      <div className="reviews-page__stats-container">
        <div className="reviews-page__stat-box">
          <h3>Total Reviews</h3>
          <div className="reviews-page__stat-value">{totalReviews.toLocaleString()}</div>
        </div>

        <div className="reviews-page__stat-divider"></div>

        <div className="reviews-page__stat-box">
          <h3>Average Rating</h3>
          <div className="reviews-page__stat-row">
            <span className="reviews-page__stat-value">{averageRating.toFixed(1)}</span>
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="reviews-page__stat-sub">Average rating on this year</div>
        </div>

        <div className="reviews-page__stat-divider"></div>

        <div className="reviews-page__stat-distribution">
          {distribution.map((d) => (
            <div key={d.stars} className="reviews-page__dist-row">
              <span className="reviews-page__dist-star-label">
                <Star size={12} fill="#6B7280" color="#6B7280" /> {d.stars}
              </span>
              <div className="reviews-page__dist-bar-bg">
                <div 
                  className="reviews-page__dist-bar-fill" 
                  style={{ 
                    width: `${totalReviews > 0 ? (d.count / totalReviews) * 100 : 0}%`,
                    backgroundColor: d.stars === 5 ? '#10B981' : d.stars === 4 ? '#A78BFA' : d.stars === 3 ? '#FBBF24' : '#EF4444'
                  }}
                ></div>
              </div>
              <span className="reviews-page__dist-count">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Header */}
      <div className="reviews-page__filters">
        <div className="reviews-page__search-wrapper">
          <Search size={18} className="reviews-page__search-icon" />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            className="reviews-page__search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="reviews-page__actions">
            <div className="reviews-page__filter-group" ref={filterRef}>
                <button 
                  className={`reviews-page__filter-btn ${filterOpen ? 'active' : ''}`} 
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                    <Filter size={18} />
                    <span>Filter</span>
                    <ChevronDown size={16} />
                </button>
                
                {filterOpen && (
                  <div className="reviews-page__filter-dropdown">
                    <div className="filter-item">
                      <label>Rating</label>
                      <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}>
                        <option value="">All Stars</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                    <div className="filter-item">
                      <label>Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
                    </div>
                    <div className="filter-item">
                      <label>End Date</label>
                      <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
                    </div>
                  </div>
                )}
            </div>

            <button className="reviews-page__sort-btn" onClick={handleSortToggle}>
                <span>{sortOrder === 'desc' ? 'Latest' : 'Oldest'}</span>
                <ChevronDown size={16} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
            </button>
        </div>
      </div>

      {/* Review List */}
      <div className="reviews-page__list">
        {loading ? (
           <div className="reviews-page__loading">Loading reviews...</div>
        ) : (
           <>
             {reviews.length === 0 && (
                <div className="reviews-page__empty">No reviews found matching your criteria.</div>
             )}
             
             {reviews.map((review) => (
               <div key={review.id} className="reviews-page__item">
                 <div className="reviews-page__user-col">
                   {/* Fallback image or initial if no image */}
                   <div className="reviews-page__avatar-placeholder" style={{backgroundColor: '#e5e7eb', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: '#6b7280'}}>
                    {getInitials(review.user_name)}
                  </div>
                   
                   <div className="reviews-page__user-info">
                     <h4>{review.user_name || 'Anonymous'}</h4>
                     <div className="reviews-page__user-meta">Email: <b>{review.user_email}</b></div>
                     <div className="reviews-page__user-meta">Product: <b>{review.product_name}</b></div>
                   </div>
                 </div>
                 
                 <div className="reviews-page__content-col">
                   <div className="reviews-page__header-row">
                     <div className="reviews-page__rating-date">
                       {renderStars(review.rating)}
                       <span className="reviews-page__date">{formatDate(review.created_at)}</span>
                     </div>
                     <button className="reviews-page__more-btn">
                         <MoreVertical size={18} />
                     </button>
                   </div>
                   
                   <p className="reviews-page__text">
                     {review.comment}
                   </p>
                   
                 </div>
               </div>
             ))}
           </>
        )}
      </div>

      {/* Pagination */}
      {reviews.length > 0 && (
        <div className="reviews-page__pagination">
          <button 
            className="reviews-page__page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="reviews-page__page-info">
            Page {meta.page || 1} of {meta.pages || 1}
          </span>
          <button 
            className="reviews-page__page-btn"
            disabled={page === (meta.pages || 1)}
            onClick={() => setPage(p => Math.min(meta.pages || 1, p + 1))}
          >
             Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
