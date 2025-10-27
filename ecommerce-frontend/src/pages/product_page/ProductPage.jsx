import React, { useState, useEffect, useRef } from 'react'
import './ProductPage.css'
import useFetchProductDetails from '../../hooks/useFetchProductDetails'
import useFetchProductReviews from '../../hooks/useFetchProductReviews'
import { useParams } from 'react-router-dom'
import ErrorModal from '../../components/modals/ErrorModal'
import RelatedProducts from './related_products/RelatedProducts.jsx'
import ZoomImage from '../../components/image_zoom/ZoomImage.jsx'

export default function ProductPage() {
  const { id } = useParams() || { id: '26' } // Default to product ID 26 if no param
  const productId = parseInt(id)
  
  // Fetch product details using the hook
  const { 
    product, 
    category, 
    images: productImages, 
    reviews, 
    reviewStats, 
    details,
    dimensions,
    sizeChart,
    careNotes,
    sustainabilityNotes,
    loading, 
    error 
  } = useFetchProductDetails({ productId })
  const { reviews: fetchedReviews, reviewStats: fetchedReviewStats, loading: reviewsLoading, error: reviewsError } = useFetchProductReviews({ productId });
  const [selectedRatings, setSelectedRatings] = useState([]);
  const onToggleRating = (rating) => {
    setSelectedRatings(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]);
  };
  const baseReviews = Array.isArray(fetchedReviews) ? fetchedReviews : reviews;
  const baseReviewStats = fetchedReviewStats || reviewStats;
  const filteredReviews = selectedRatings.length > 0 ? baseReviews.filter(rv => selectedRatings.includes(Math.round(rv?.rating || 0))) : baseReviews;
  const formatDateDDMMYYYY = (input) => {
    if (!input) return '';
    const d = new Date(input);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = monthNames[d.getMonth()] || '';
    const yyyy = String(d.getFullYear());
    return `${dd} ${monthName} ${yyyy}`;
  };
  const renderStarsSVG = (ratingInput) => {
    const r = Math.max(0, Math.min(5, Math.round(Number(ratingInput) || 0)));
    return Array.from({ length: 5 }, (_, i) => (
      <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill={i < r ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ));
  };
  
  // Derived UI helpers
  const ratingDistribution = (Array.isArray(baseReviews) && baseReviews.length > 0)
    ? [5,4,3,2,1].map(r => {
        const count = baseReviews.filter(rv => Math.round(rv?.rating || 0) === r).length;
        const percentage = baseReviews.length ? Math.round((count / baseReviews.length) * 100) : 0;
        return { rating: r, count, percentage };
      })
    : [];
  const stockCount = product?.stock ?? product?.inventory ?? product?.quantity_available ?? product?.available_quantity ?? null;
  const inStock = stockCount != null ? stockCount > 0 : (product?.in_stock ?? product?.available ?? true);
  const currentCategoryId = product?.category_id ?? category?.id ?? null;
  const currentCategoryName = product?.category_name ?? category?.name ?? null;

  // Smooth expand/collapse for specs section
  const specsDetailsRef = useRef(null);
  const specsContentRef = useRef(null);
  useEffect(() => {
    const detailsEl = specsDetailsRef.current;
    const contentEl = specsContentRef.current;
    if (!detailsEl || !contentEl) return;

    const onToggle = () => {
      const isOpen = detailsEl.open;
      if (isOpen) {
        // Opening: from 0 -> auto via measured height
        contentEl.style.height = '0px';
        contentEl.style.opacity = '0';
        const measured = contentEl.scrollHeight;
        contentEl.style.height = measured + 'px';
        contentEl.style.opacity = '1';
        const finalizeOpen = () => {
          contentEl.style.height = 'auto';
          contentEl.removeEventListener('transitionend', finalizeOpen);
        };
        contentEl.addEventListener('transitionend', finalizeOpen);
      } else {
        // Closing: from current auto -> 0 using measured height
        const measured = contentEl.scrollHeight;
        contentEl.style.height = measured + 'px';
        requestAnimationFrame(() => {
          contentEl.style.height = '0px';
          contentEl.style.opacity = '0';
        });
      }
    };

    // Initialize visual state
    contentEl.style.height = detailsEl.open ? 'auto' : '0px';
    contentEl.style.opacity = detailsEl.open ? '1' : '0';

    detailsEl.addEventListener('toggle', onToggle);
    return () => detailsEl.removeEventListener('toggle', onToggle);
  }, []);

  // State
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [formattedImages, setFormattedImages] = useState([])
  const [availableSizes, setAvailableSizes] = useState([])
  const [imagesLoaded, setImagesLoaded] = useState({})
  const imageObserver = useRef(null)
  const imageRefs = useRef({})
  
  // Initialize state values after product data is loaded
  useEffect(() => {
    if (product) {
      // Set default color if available
      if (details?.color) {
        setSelectedColor(details.color)
      }
      
      // Set available sizes from size chart if available
      if (sizeChart && typeof sizeChart === 'object') {
        const sizes = Object.keys(sizeChart)
        setAvailableSizes(sizes)
        if (sizes.length > 0) {
          setSelectedSize(sizes[0])
        }
      }
      
      // Format images (filter out empty/invalid URLs)
      if (productImages && productImages.length > 0) {
        const valid = productImages.filter(u => typeof u === 'string' && u.trim().length > 0)
        const formatted = valid.map((url, index) => ({
          src: url.trim(),
          alt: `${product.name} view ${index + 1}`
        }))
        setFormattedImages(formatted)
        if (formatted.length > 0 && selectedImage >= formatted.length) {
          setSelectedImage(0)
        }
      }
    }
  }, [product, details, sizeChart, productImages])
  
  // Setup Intersection Observer for lazy loading images
  useEffect(() => {
    imageObserver.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const imageId = entry.target.dataset.id
          const img = new Image()
          img.src = entry.target.dataset.src
          img.onload = () => {
            setImagesLoaded(prev => ({
              ...prev,
              [imageId]: true
            }))
          }
          imageObserver.current.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '100px' })
    
    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect()
      }
    }
  }, [])
  
  // Observe image elements when they're rendered
  useEffect(() => {
    Object.values(imageRefs.current).forEach(ref => {
      if (ref && imageObserver.current) {
        imageObserver.current.observe(ref)
      }
    })
  }, [formattedImages])

  // Handlers
  const handleAddToCart = () => {
    console.log('Add to cart', { 
      product: product?.name, 
      color: selectedColor, 
      size: selectedSize 
    })
  }
  
  const handleCheckout = () => {
    console.log('Checkout now', { 
      product: product?.name, 
      color: selectedColor, 
      size: selectedSize 
    })
  }

  // Navigation for gallery
  const nextImage = () => {
    setSelectedImage((prev) => (prev === formattedImages.length - 1 ? prev : prev + 1))
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? prev : prev - 1))
  }

  return (
      <div className="product-page">
        {loading ? (
        <div className="product-layout">
          {/* Left column - Product gallery skeleton */}
          <div className="product-gallery">
            <div className="main-image-container">
              <div className="skeleton skeleton-image"></div>
              
              <button className="gallery-nav prev" disabled aria-label="Previous image">
                &lt;
              </button>
              
              <button className="gallery-nav next" disabled aria-label="Next image">
                &gt;
              </button>
            </div>
            
            <div className="thumbnails">
              {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="thumbnail">
                  <div className="skeleton skeleton-thumbnail"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right column - Product info skeleton */}
          <div className="product-info">
            <div className="skeleton skeleton-title"></div>
            
            <div className="product-meta">
              <div className="skeleton skeleton-price"></div>
              <div className="skeleton skeleton-text short"></div>
            </div>
            
            <div className="product-description">
              <div className="skeleton skeleton-text short"></div>
              <div className="skeleton skeleton-text long"></div>
              <div className="skeleton skeleton-text medium"></div>
            </div>
            
            <div className="product-options">
              <div className="skeleton skeleton-text short"></div>
              <div className="skeleton skeleton-text medium"></div>
              <div className="skeleton skeleton-text long"></div>
            </div>
            
            <div className="product-actions">
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <>
          <ErrorModal message={`Error loading product: ${error}`} />
          <div className="product-empty">
            <img 
              src="/illustrations/hand-drawn-no-data-illustration.png" 
              alt="Database connection error" 
              className="empty-illustration"
            />
            <p className="empty-message">We're having trouble connecting to our database. Please try again later.</p>
          </div>
        </>
      ) : !product ? (
        <div className="product-empty">
          <img 
            src="/illustrations/hand-drawn-no-data-illustration.png" 
            alt="No product found" 
            className="empty-illustration"
          />
          <p className="empty-message">
            No such product found. The product may have been removed or is no longer available.
          </p>
        </div>
      ) : (
        <div className="product-layout">
          {/* Left column - Product gallery */}
          <div className="product-gallery">
            <div className="main-image-container">
              {formattedImages.length > 0 && (
                <div 
                  ref={el => imageRefs.current['main'] = el}
                  data-id="main"
                  data-src={formattedImages[selectedImage].src}
                  className="main-image-wrapper"
                >
                  {!imagesLoaded['main'] && <div className="skeleton skeleton-image"></div>}
                  {imagesLoaded['main'] && (
                    <ZoomImage
                      src={formattedImages[selectedImage].src}
                      alt={formattedImages[selectedImage].alt}
                      className="main-image"
                    />
                  )}
                </div>
              )}
              
              <button 
                className="gallery-nav prev" 
                onClick={prevImage}
                disabled={selectedImage === 0}
                aria-label="Previous image"
              >
                &lt;
              </button>
              
              <button 
                className="gallery-nav next" 
                onClick={nextImage}
                disabled={selectedImage === formattedImages.length - 1}
                aria-label="Next image"
              >
                &gt;
              </button>
              
              <button className="action-button share" aria-label="Share">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08261 9.84066C7.54305 9.32015 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.6798 8.08261 14.1593L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.457 16.3202 15.9174 16.8407L8.97733 12.3706C8.99229 12.2492 9 12.1255 9 12C9 11.8745 8.99229 11.7508 8.97733 11.6294L15.9174 7.15934C16.457 7.67985 17.1911 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button className="action-button wishlist" aria-label="Add to wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="thumbnails">
              {formattedImages.map((image, index) => (
                <button 
                  key={index} 
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View ${image.alt}`}
                  aria-current={selectedImage === index}
                >
                  <div 
                    ref={el => imageRefs.current[`thumb-${index}`] = el}
                    data-id={`thumb-${index}`}
                    data-src={image.src}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {!imagesLoaded[`thumb-${index}`] && <div className="skeleton skeleton-thumbnail"></div>}
                    {imagesLoaded[`thumb-${index}`] && (
                      <img 
                        src={image.src || null}
                        alt="" 
                        className="lazy-image loaded"
                        style={{ display: 'block' }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right column - Product info */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-meta">
                <div className="price-container">
                  <span className="current-price">${parseFloat(product.price).toFixed(2)}</span>
                </div>
                <div className="product-stats">
                  <div className="rating">
                    <span className="stars">★ {Number(baseReviewStats?.averageRating || 0).toFixed(1)}</span>
                    <span className="review-count">({baseReviewStats?.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
              {/* stock badge moved above product-actions */}
            
            <div className="product-description">
              <h2>Description:</h2>
              <p>{product.description}</p>
            </div>
            
            <div className="product-options">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                {details?.color && (
                  <div className="color-selection">
                    <div className="option-label">Color: <span className="selected-value">{selectedColor}</span></div>
                    <div className="color-options">
                      <button
                        className="color-option selected"
                        style={{ backgroundColor: (typeof selectedColor === 'string' && selectedColor.startsWith('#')) ? selectedColor : 'var(--color-bg)' }}
                        aria-label={`Color: ${selectedColor}`}
                        aria-pressed={true}
                      />
                    </div>
                  </div>
                )}
                
                {availableSizes.length > 0 && (
                  <div className="size-selection">
                    <div className="size-header">
                      <div className="option-label">Size: <span className="selected-value">{selectedSize}</span></div>
                    </div>
                    <div className="size-options">
                      {availableSizes.map((size) => (
                      <button
                        key={size}
                        className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(size)}
                        aria-label={`Select size ${size}`}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
              
              <details className="specs-details" ref={specsDetailsRef}>
                <summary className="specs-toggle">Show More <span className="chevron">›</span></summary>
                <div className="specs-content" ref={specsContentRef}>
                  <div className="specs-flex">
                    <div className="specs-column">
                      {Array.isArray(careNotes) && careNotes.length > 0 && (
                        <div className="care-notes">
                          <h3>Care Notes:</h3>
                          <ul className="list-tabular">
                            {careNotes.map((note, index) => (
                              <li key={index} className="list-row">{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {details?.features && (
                        <div className="features">
                          <h3>Features:</h3>
                          <ul className="list-tabular">
                            {details.features.map((feature, index) => (
                              <li key={index} className="list-row">{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  
                    <div className="specs-column">
                      {details?.material && (
                        <div className="material">
                          <h3>Material:</h3>
                          <p className="material-row">{details.material}</p>
                        </div>
                      )}
                      {sizeChart && (
                        <div className="size-chart">
                          <h3>Size Chart:</h3>
                          <table className="size-chart-table">
                            <thead>
                              <tr>
                                <th>Size</th>
                                <th>Measurement</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(sizeChart).map(([size, measurement]) => (
                                <tr key={size}>
                                  <td>{size}</td>
                                  <td>{typeof measurement === 'object' ? JSON.stringify(measurement) : String(measurement)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {dimensions && (
                        <div className="dimensions">
                          <h3>Dimensions:</h3>
                          {Array.isArray(dimensions) ? (
                            <ul className="list-tabular">
                              {dimensions.map((d, idx) => <li key={idx} className="list-row">{d}</li>)}
                            </ul>
                          ) : (
                            <table className="dimensions-table">
                              <tbody>
                                {Object.entries(dimensions).filter(([key]) => key !== 'size_chart').map(([key, value]) => (
                                  <tr key={key}>
                                    <td className="dim-key">{key.replace(/_/g, ' ')}</td>
                                    <td className="dim-val">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </details>
              
              {sustainabilityNotes && (
                <div className="sustainability-notes">
                  <h3>Sustainability:</h3>
                  {Array.isArray(sustainabilityNotes) ? (
                    <ul>
                      {sustainabilityNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>
                      {Array.isArray(sustainabilityNotes?.certifications) && sustainabilityNotes.certifications.length > 0 && (
                        <div className="certifications">
                          <strong>Certifications:</strong>
                          <ul>
                            {sustainabilityNotes.certifications.map((c, idx) => <li key={idx}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                      {sustainabilityNotes?.description && (
                        <p className="sustainability-description">{sustainabilityNotes.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="stock-row">
              <span className={`stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                {inStock ? 'In Stock' : 'Out of Stock'}{typeof stockCount === 'number' ? ` • ${stockCount} available` : ''}
              </span>
            </div>
            <div className="product-actions">
              <button className="add-to-cart-button" onClick={handleAddToCart}>
                Add To Cart
              </button>
              <button className="checkout-button" onClick={handleCheckout}>
                Checkout Now
              </button>
            </div>
            
            <div className="delivery-info">
              <a href="#delivery" className="delivery-link">Delivery T&C</a>
            </div>
          </div>
        </div>
      )}
      
      {/* Related Products Section */}
      <RelatedProducts categoryId={currentCategoryId} categoryName={currentCategoryName} currentProductId={productId} />
      
      {/* Product Reviews Section */}
      <section className="product-reviews-section">
        <h2>Product Reviews</h2>
        
        <div className="reviews-container">
          {/* Reviews Summary */}
          {reviewsLoading ? (
            <div className="reviews-summary" aria-busy="true" aria-live="polite">
              <div className="average-rating">
                <div className="skeleton-block" style={{ width: '64px', height: '48px' }} aria-hidden="true"></div>
                <div className="skeleton-block" style={{ width: '120px', height: '20px', marginTop: '10px' }} aria-hidden="true"></div>
                <div className="skeleton-block" style={{ width: '140px', height: '14px', marginTop: '10px' }} aria-hidden="true"></div>
              </div>
              <div className="rating-distribution">
                {[...Array(5)].map((_, i) => (
                  <div className="rating-bar" key={i}>
                    <div className="skeleton-block" style={{ width: '30px', height: '14px' }} aria-hidden="true"></div>
                    <div className="progress-bar-container">
                      <div className="skeleton-block" style={{ width: '100%', height: '8px' }} aria-hidden="true"></div>
                    </div>
                    <div className="skeleton-block" style={{ width: '40px', height: '14px' }} aria-hidden="true"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="reviews-summary">
              <div className="average-rating">
                <div className="rating-number">{Number(baseReviewStats?.averageRating || 0).toFixed(1)}</div>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className="star">
                      {star <= Math.floor(Number(baseReviewStats?.averageRating || 0)) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <div className="total-reviews">from {baseReviewStats?.reviewCount || 0} reviews</div>
              </div>
              
              <div className="rating-distribution">
                {(ratingDistribution.length > 0 ? ratingDistribution : [5,4,3,2,1].map(r => ({ rating: r, count: 0, percentage: 0 })) ).map(item => (
                  <div className="rating-bar" key={item.rating}>
                    <div className="rating-label">{item.rating}.0</div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="rating-count">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="reviews-content">
            {/* Reviews Filter */}
            <div className="reviews-filter">
              <h3>Reviews Filter</h3>
              
              <div className="filter-section">
                <h4 className="filter-title">Rating</h4>
                <div className="filter-options">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <label className="filter-option" key={rating}>
                      <input
                        type="checkbox"
                        name={`rating-${rating}`}
                        checked={selectedRatings.includes(rating)}
                        onChange={() => onToggleRating(rating)}
                      />
                      <span className="star-rating">
                        <span className="star">★</span> {rating}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              

            </div>
            
            {/* Review Lists */}
            <div className="review-lists">
              <div className="review-lists-header">
                <h3>See What Others Are Saying</h3>
                <button type="button" className="review-write-btn">Write Review</button>
              </div>
              
              <div className="review-items">
                {reviewsLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div className="review-item" key={`skeleton-${i}`}>
                        <div className="review-header" style={{ fontFamily: 'var(--font-primary)' }}>
                          <span className="skeleton-block" style={{ width: '180px', height: '16px' }} aria-hidden="true"></span>
                          <span className="skeleton-block" style={{ width: '120px', height: '14px', marginLeft: 12 }} aria-hidden="true"></span>
                          <span className="skeleton-block" style={{ width: '100px', height: '16px', marginLeft: 'auto' }} aria-hidden="true"></span>
                        </div>
                        <div className="review-content comment">
                          <div className="skeleton-block" style={{ width: '90%', height: '12px' }} aria-hidden="true"></div>
                          <div className="skeleton-block" style={{ width: '70%', height: '12px', marginTop: 8 }} aria-hidden="true"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : Array.isArray(filteredReviews) && filteredReviews.length > 0 ? (
                  filteredReviews.map(review => (
                    <div className="review-item" key={review.id || review._id}>
                      <div className="review-header" style={{ fontFamily: 'var(--font-primary)' }}>
                        <span className="review-name">{review?.user_name || review?.author || review?.user?.name || 'Anonymous'}</span>
                        {' - '}
                        <span className="review-date">{formatDateDDMMYYYY(review?.created_at || review?.createdAt || review?.date)}</span>
                        <span className="review-stars" aria-label={`${Math.round(review?.rating || 0)} out of 5 stars`}>{renderStarsSVG(review?.rating)}</span>
                      </div>
                      <div className="review-content comment">
                        <p>{review?.comment || review?.content || review?.text || ''}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="review-item">
                    <div className="review-content no-reviews">
                      <img src="/illustrations/hand-drawn-no-data-illustration.png" alt="No reviews illustration" className="no-reviews__img" loading="lazy" />
                      <p className="no-reviews__text">No such rating is given yet, be the first to rate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    {error && (
      <ErrorModal 
        message={error.message || "Failed to load product details"} 
        onClose={() => {}}
      />
    )}
    </div>
  );
}