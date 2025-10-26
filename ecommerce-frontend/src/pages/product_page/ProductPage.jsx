import React, { useState, useEffect, useRef } from 'react'
import './ProductPage.css'
import useFetchProductDetails from '../../hooks/useFetchProductDetails'
import { useParams } from 'react-router-dom'
import ErrorModal from '../../components/modals/ErrorModal'
import RelatedProducts from './related_products/RelatedProducts.jsx'
import ZoomImage from '../../components/image_zoom/ZoomImage.jsx'

// Placeholder components for future implementation
const RelatedProductsSection = () => <div className="related-products-section">Related Products Coming Soon</div>
const ProductReviewsSection = () => <div className="product-reviews-section">Product Reviews Coming Soon</div>

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
  
  // Derived UI helpers
  const ratingDistribution = (Array.isArray(reviews) && reviews.length > 0)
    ? [5,4,3,2,1].map(r => {
        const count = reviews.filter(rv => Math.round(rv?.rating || 0) === r).length;
        const percentage = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
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
  
  // Related products data - keeping this for now as mentioned
  const relatedProducts = [
    {
      id: 1,
      brand: 'Whistle',
      name: 'Wide Leg Cropped Jeans, Denim',
      price: 26,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 2,
      brand: 'John Lewis ANYDAY',
      name: 'Long Sleeve Utility Shirt, Navy, 6',
      price: 26,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1520975922211-52c36e38d5cb?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 3,
      brand: 'John Lewis ANYDAY',
      name: 'Stripe Overshirt, Light Blue',
      price: 32,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 4,
      brand: 'John Lewis ANYDAY',
      name: 'Denim Shirt, Mid Wash',
      price: 40,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1540574769061-5f0b6d3b35b1?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 5,
      brand: 'John Lewis',
      name: 'Linen Blazer, Navy',
      price: 79,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1556909114-23d18c54d9a9?q=80&w=400&auto=format&fit=crop'
    }
  ]
  
  // Reviews data - keeping this for now as mentioned
  const reviewsData = {
    averageRating: 4.5,
    totalReviews: 1259,
    ratingDistribution: [
      { rating: 5, count: 2823, percentage: 80 },
      { rating: 4, count: 38, percentage: 15 },
      { rating: 3, count: 4, percentage: 3 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 }
    ],
    reviews: [
      {
        id: 1,
        author: 'Darrell Steward',
        rating: 5,
        date: 'July 2, 2020 03:29 PM',
        content: 'This is amazing product I have.',
        helpfulCount: 128
      },
      {
        id: 2,
        author: 'Darlene Robertson',
        rating: 5,
        date: 'July 2, 2020 1:04 PM',
        content: 'This is amazing product I have.',
        helpfulCount: 82
      },
      {
        id: 3,
        author: 'Kathryn Murphy',
        rating: 5,
        date: 'June 26, 2020 10:03 PM',
        content: 'This is amazing product I have.',
        helpfulCount: 9
      }
    ]
  }

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
      
      // Format images
      if (productImages && productImages.length > 0) {
        const formatted = productImages.map((url, index) => ({
          src: url.trim(),
          alt: `${product.name} view ${index + 1}`
        }))
        setFormattedImages(formatted)
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
                    <img 
                      src={imagesLoaded[`thumb-${index}`] ? image.src : ''}
                      alt="" 
                      className={`lazy-image ${imagesLoaded[`thumb-${index}`] ? 'loaded' : ''}`}
                      style={{ display: imagesLoaded[`thumb-${index}`] ? 'block' : 'none' }}
                    />
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
                    <span className="stars">★ {Number(reviewStats?.averageRating || 0).toFixed(1)}</span>
                    <span className="review-count">({reviewStats?.reviewCount || 0} reviews)</span>
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
          <div className="reviews-summary">
            <div className="average-rating">
              <div className="rating-number">{Number(reviewStats?.averageRating || 0).toFixed(1)}</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className="star">
                    {star <= Math.floor(Number(reviewStats?.averageRating || 0)) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <div className="total-reviews">from {reviewStats?.reviewCount || 0} reviews</div>
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
          
          <div className="reviews-content">
            {/* Reviews Filter */}
            <div className="reviews-filter">
              <h3>Reviews Filter</h3>
              
              <div className="filter-section">
                <h4 className="filter-title">Rating</h4>
                <div className="filter-options">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <label className="filter-option" key={rating}>
                      <input type="checkbox" name={`rating-${rating}`} />
                      <span className="star-rating">
                        <span className="star">★</span> {rating}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-section">
                <h4 className="filter-title">Review Topics</h4>
                <div className="filter-options">
                  {['Product Quality', 'Seller Services', 'Product Price', 'Shipment', 'Match with Description'].map(topic => (
                    <label className="filter-option" key={topic}>
                      <input type="checkbox" name={topic.toLowerCase().replace(/\s+/g, '-')} />
                      <span>{topic}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Review Lists */}
            <div className="review-lists">
              <div className="review-lists-header">
                <h3>Review Lists</h3>
                <div className="review-tabs">
                  <button className="review-tab active">All Reviews</button>
                  <button className="review-tab">With Photo & Video</button>
                  <button className="review-tab">With Description</button>
                </div>
              </div>
              
              <div className="review-items">
                {Array.isArray(reviews) && reviews.length > 0 ? (
                  reviews.map(review => (
                    <div className="review-item" key={review.id || review._id}>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className="star">
                            {star <= Math.round(review?.rating || 0) ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      
                      <div className="review-content">
                        <p>{review?.content || review?.text || review?.comment || ''}</p>
                      </div>
                      
                      <div className="review-meta">
                        <div className="review-date">{review?.date || review?.created_at || review?.createdAt || ''}</div>
                      </div>
                      
                      <div className="review-author">
                        <div className="author-avatar">
                          <img src={`https://i.pravatar.cc/40?u=${review.id || review._id}`} alt={review?.author || review?.user?.name || 'Reviewer'} />
                        </div>
                        <div className="author-name">{review?.author || review?.user?.name || 'Anonymous'}</div>
                      </div>
                      
                      <div className="review-actions">
                        <button className="helpful-button">
                          <span className="thumbs-up-icon">👍</span>
                          <span className="helpful-count">{review?.helpfulCount || review?.helpful || 0}</span>
                        </button>
                        <button className="not-helpful-button">
                          <span className="thumbs-down-icon">👎</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="review-item">
                    <div className="review-content">
                      <p>No reviews yet.</p>
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