import React, { useState } from 'react'
import './ProductPage.css'

export default function ProductPage() {
  // Product data
  const product = {
    brand: 'John Lewis ANYDAY',
    name: 'Long Sleeve Overshirt, Khaki, 6',
    compareAtPrice: 40.00,
    price: 28.00,
    soldCount: 1238,
    rating: 4.5,
    description: 'Boba etam u olu bais tea est potus delectus singulari commodo posuere at textum, quuno in Taiwan annis 1980 erat sunt. Boba referat ad pilas masticas tapiocas in fluidis potibus universes, quae typo lac tea rispo seputnum. Boba phanomenon.',
    colors: [
      { hex: '#5a3b1f', name: 'Royal Brown' },
      { hex: '#d8d8d8', name: 'Grey' },
      { hex: '#1f4f7a', name: 'Navy' },
      { hex: '#111111', name: 'Black' },
    ],
    sizes: [6, 8, 10, 14, 18, 20],
    images: [
      { src: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop', alt: 'Overshirt front' },
      { src: 'https://images.unsplash.com/photo-1520975922211-52c36e38d5cb?q=80&w=1200&auto=format&fit=crop', alt: 'Overshirt side' },
      { src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop', alt: 'Overshirt back' },
      { src: 'https://images.unsplash.com/photo-1540574769061-5f0b6d3b35b1?q=80&w=1200&auto=format&fit=crop', alt: 'Overshirt detail' },
      { src: 'https://images.unsplash.com/photo-1556909114-23d18c54d9a9?q=80&w=1200&auto=format&fit=crop', alt: 'Overshirt lifestyle' },
    ],
  }
  
  // Related products data
  const relatedProducts = [
    {
      id: 1,
      brand: 'Whistle',
      name: 'Wide Leg Cropped Jeans, Denim',
      price: 26,
      rating: 4.8,
      soldCount: 1218,
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 2,
      brand: 'John Lewis ANYDAY',
      name: 'Long Sleeve Utility Shirt, Navy, 6',
      price: 26,
      rating: 4.5,
      soldCount: 1238,
      image: 'https://images.unsplash.com/photo-1520975922211-52c36e38d5cb?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 3,
      brand: 'John Lewis ANYDAY',
      name: 'Stripe Overshirt, Light Blue',
      price: 32,
      rating: 4.5,
      soldCount: 1320,
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 4,
      brand: 'John Lewis ANYDAY',
      name: 'Denim Shirt, Mid Wash',
      price: 40,
      rating: 4.8,
      soldCount: 1318,
      image: 'https://images.unsplash.com/photo-1540574769061-5f0b6d3b35b1?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 5,
      brand: 'John Lewis',
      name: 'Linen Blazer, Navy',
      price: 79,
      rating: 4.8,
      soldCount: 1238,
      image: 'https://images.unsplash.com/photo-1556909114-23d18c54d9a9?q=80&w=400&auto=format&fit=crop'
    }
  ]
  
  // Reviews data
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
  const [selectedColor, setSelectedColor] = useState(product.colors[0].hex)
  const [selectedSize, setSelectedSize] = useState(8)

  // Handlers
  const handleAddToCart = () => {
    console.log('Add to cart', { product: product.name, color: selectedColor, size: selectedSize })
  }
  
  const handleCheckout = () => {
    console.log('Checkout now', { product: product.name, color: selectedColor, size: selectedSize })
  }

  // Navigation for gallery
  const nextImage = () => {
    setSelectedImage((prev) => (prev === product.images.length - 1 ? prev : prev + 1))
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? prev : prev - 1))
  }

  return (
    <div className="product-page">
      <div className="product-layout">
        {/* Left column - Product gallery */}
        <div className="product-gallery">
          <div className="main-image-container">
            <img 
              src={product.images[selectedImage].src} 
              alt={product.images[selectedImage].alt} 
              className="main-image" 
            />
            
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
              disabled={selectedImage === product.images.length - 1}
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
            {product.images.map((image, index) => (
              <button 
                key={index} 
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
                aria-label={`View ${image.alt}`}
                aria-current={selectedImage === index}
              >
                <img src={image.src} alt="" />
              </button>
            ))}
          </div>
        </div>
        
        {/* Right column - Product info */}
        <div className="product-info">
          <div className="product-brand">{product.brand}</div>
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-meta">
            <div className="price-container">
              <span className="compare-price">£{product.compareAtPrice.toFixed(2)}</span>
              <span className="current-price">£{product.price.toFixed(2)}</span>
            </div>
            <div className="product-stats">
              <span className="sold-count">{product.soldCount} Sold</span>
              <div className="rating">
                <span className="stars">★ {product.rating}</span>
              </div>
            </div>
          </div>
          
          <div className="product-description">
            <h2>Description:</h2>
            <p>{product.description} <a href="#more" className="see-more">See More...</a></p>
          </div>
          
          <div className="product-options">
            <div className="color-selection">
              <div className="option-label">Color: <span className="selected-value">{product.colors.find(c => c.hex === selectedColor)?.name}</span></div>
              <div className="color-options">
                {product.colors.map((color) => (
                  <button
                    key={color.hex}
                    className={`color-option ${selectedColor === color.hex ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color.hex)}
                    aria-label={`Select ${color.name}`}
                    aria-pressed={selectedColor === color.hex}
                  />
                ))}
              </div>
            </div>
            
            <div className="size-selection">
              <div className="size-header">
                <div className="option-label">Size: <span className="selected-value">{selectedSize}</span></div>
                <a href="#size-chart" className="size-chart-link">View Size Chart</a>
              </div>
              <div className="size-options">
                {product.sizes.map((size) => (
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
      
      {/* Related Products Section */}
      <section className="related-products-section">
        <div className="section-header">
          <h2>Related Product</h2>
          <a href="#view-all" className="view-all-link">View All</a>
        </div>
        
        <div className="related-products-grid">
          {relatedProducts.map(product => (
            <div className="related-product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-details">
                <div className="product-brand">{product.brand}</div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">${product.price}</div>
                <div className="product-meta">
                  <div className="rating">
                    <span className="stars">★ {product.rating}</span>
                  </div>
                  <div className="sold-count">{product.soldCount} Sold</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Product Reviews Section */}
      <section className="product-reviews-section">
        <h2>Product Reviews</h2>
        
        <div className="reviews-container">
          {/* Reviews Summary */}
          <div className="reviews-summary">
            <div className="average-rating">
              <div className="rating-number">{reviewsData.averageRating}</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className="star">
                    {star <= Math.floor(reviewsData.averageRating) ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <div className="total-reviews">from {reviewsData.totalReviews} reviews</div>
            </div>
            
            <div className="rating-distribution">
              {reviewsData.ratingDistribution.map(item => (
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
                {reviewsData.reviews.map(review => (
                  <div className="review-item" key={review.id}>
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="star">
                          {star <= review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    
                    <div className="review-content">
                      <p>{review.content}</p>
                    </div>
                    
                    <div className="review-meta">
                      <div className="review-date">{review.date}</div>
                    </div>
                    
                    <div className="review-author">
                      <div className="author-avatar">
                        <img src={`https://i.pravatar.cc/40?u=${review.id}`} alt={review.author} />
                      </div>
                      <div className="author-name">{review.author}</div>
                    </div>
                    
                    <div className="review-actions">
                      <button className="helpful-button">
                        <span className="thumbs-up-icon">👍</span>
                        <span className="helpful-count">{review.helpfulCount}</span>
                      </button>
                      <button className="not-helpful-button">
                        <span className="thumbs-down-icon">👎</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}