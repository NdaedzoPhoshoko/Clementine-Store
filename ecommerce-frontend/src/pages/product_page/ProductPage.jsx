import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import './ProductPage.css'

const StarRating = ({ rating = 0 }) => {
  const rounded = Math.round(rating)
  const stars = Array.from({ length: 5 }, (_, i) => (i < rounded ? '★' : '☆'))
  return (
    <span className="stars" aria-label={`${rounded} out of 5`}>
      {stars.join(' ')}
    </span>
  )
}

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`accordion ${open ? 'is-open' : ''}`}>
      <button
        className="accordion__header"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? 'true' : 'false'}
      >
        <span className="accordion__title">{title}</span>
        <span className="accordion__icon" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="accordion__content">{children}</div>}
    </div>
  )
}

// --- Reviews helpers ---
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className={`toggle ${checked ? 'is-on' : ''}`}
    onClick={() => onChange(!checked)}
    aria-pressed={checked ? 'true' : 'false'}
  >
    <span className="toggle__thumb" />
  </button>
)

const FitBars = ({ stats = { small: 0, trueSize: 0, large: 0 } }) => (
  <div className="fit-bars">
    <div className="fit-bar">
      <span className="fit-bar__label">Small</span>
      <span className="fit-bar__meter"><span style={{ width: `${stats.small}%` }} /></span>
      <span className="fit-bar__percent">{stats.small}%</span>
    </div>
    <div className="fit-bar">
      <span className="fit-bar__label">True to Size</span>
      <span className="fit-bar__meter"><span style={{ width: `${stats.trueSize}%` }} /></span>
      <span className="fit-bar__percent">{stats.trueSize}%</span>
    </div>
    <div className="fit-bar">
      <span className="fit-bar__label">Large</span>
      <span className="fit-bar__meter"><span style={{ width: `${stats.large}%` }} /></span>
      <span className="fit-bar__percent">{stats.large}%</span>
    </div>
  </div>
)

const fitLabel = (fit) => (fit === 'small' ? 'Small' : fit === 'large' ? 'Large' : 'True to Size')

const ReviewCard = ({ review }) => {
  const [helpful, setHelpful] = useState(review.helpful || 0)
  return (
    <li className="review-card">
      <div className="review-card__header">
        <StarRating rating={review.rating} />
        <time className="review-card__date" dateTime={review.date}>{review.date}</time>
      </div>
      <div className="review-card__details">
        <span>Overall Fit: {fitLabel(review.fit)}</span>
        {review.height_cm && <span>Height: {review.height_cm} cm / {review.height_in} in</span>}
        {review.weight_kg && <span>Weight: {review.weight_kg} kg / {review.weight_lb} lbs</span>}
        {review.bust_cm && <span>Bust: {review.bust_cm} cm / {review.bust_in} in</span>}
        {review.waist_cm && <span>Waist: {review.waist_cm} cm / {review.waist_in} in</span>}
        {review.hips_cm && <span>Hips: {review.hips_cm} cm / {review.hips_in} in</span>}
        {review.color && <span>Color: {review.color}</span>}
        {review.size && <span>Size: {review.size}</span>}
      </div>
      <p className="review-card__text">{review.comment}</p>
      {review.images?.length ? (
        <div className="review-card__images">
          {review.images.map((src, i) => (
            <img key={`revimg-${i}`} src={src} alt={`Customer photo ${i + 1}`} />
          ))}
        </div>
      ) : null}
      <div className="review-card__footer">
        <button className="link" type="button">Translate</button>
        <div className="review-card__actions">
          <button className="helpful-btn" type="button" onClick={() => setHelpful((h) => h + 1)}>
            Helpful <span className="count">({helpful})</span>
          </button>
          <button className="more-btn" type="button" aria-label="More options">•••</button>
        </div>
      </div>
    </li>
  )
}

function formatCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function ProductPage() {
  const { id } = useParams()

  // Placeholder product data until API integration
  const product = useMemo(() => ({
    id: id || 'demo-chair',
    name: 'Leon Accent Chair',
    designer: 'Carly Cushnie',
    description:
      'Fashion designer and creative director Carly Cushnie brings her celebrated sense of style to interiors with her first-ever line of furniture. The Leon chair folds easy comfort into an elevated design with its dramatic shape and channel tufting, dressed all over in a textural boucle.',
    price: 1198,
    stock: 8,
    colors: ['#d3d3d3', '#b7b1a6', '#111111'],
     images: [
        { src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop', alt: 'Accent chair in living room' },
        { src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop', alt: 'Chair close-up texture' },
        { src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop', alt: 'Chair side profile' },
        { src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop', alt: 'Chair back detail' },
      ],
      swatchUrl: '#',
      shipping: {
        freeShippingThreshold: 50,
        deliveryEstimate: '2–5 business days',
        returnsPolicy: '30-day hassle-free returns',
      },
      details: [
        'Textural boucle upholstery',
        'Solid wood frame',
        'Professional upholstery cleaning recommended',
      ],
      dimensions: [
        'Overall: 30"W x 36"D x 30"H',
        'Seat height: 18"',
        'Weight: 28 lb',
      ],
      care: [
        'Vacuum regularly using upholstery attachment',
        'Blot spills immediately',
        'Avoid direct sunlight to prevent fading',
      ],
      sustainability: [
        'Made with sustainably sourced materials',
        'Low-VOC finishes',
      ],
      // --- Reviews meta ---
    reviewTags: [
      { label: 'Fast Logistics', count: 3 },
      { label: 'Good Portability', count: 4 },
      { label: 'Great Service', count: 1 },
      { label: 'Elegant', count: 2 },
      { label: 'Thanksgiving', count: 5 },
      { label: 'Spring Outfits', count: 2 },
      { label: 'Eco-Friendly', count: 1 },
      { label: 'For Costumes', count: 2 },
      { label: 'Gorgeous', count: 3 },
      { label: 'Never Received This Item', count: 2 },
    ],
    fitStats: { small: 2, trueSize: 87, large: 11 },
    localAverage: 4.97,
    reviews: [
      {
        rating: 5,
        author: 'd***x',
        date: '2025-08-21',
        fit: 'true',
        height_cm: 189,
        height_in: 74,
        weight_kg: 95,
        weight_lb: 209,
        bust_cm: 113,
        bust_in: 44,
        waist_cm: 95,
        waist_in: 37,
        hips_cm: 109,
        hips_in: 43,
        color: 'Khaki',
        size: 'XL',
        comment: 'Good material I love it',
        images: [
          'https://images.unsplash.com/photo-1582582494700-75b2548c2e50?q=80&w=800&auto=format&fit=crop',
        ],
        helpful: 11,
        tags: ['Gorgeous'],
      },
      {
        rating: 5,
        author: 'm***a',
        date: '2025-10-03',
        fit: 'true',
        color: 'Khaki',
        size: 'XL',
        comment: 'The quality of these is so good I’m glad I bought it, very satisfying',
        images: [
          'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1503341458764-78d3f372b9e0?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0f?q=80&w=800&auto=format&fit=crop',
        ],
        helpful: 5,
        tags: ['Good Portability'],
      },
      { rating: 4, author: 'Ava', date: '2024-06-12', fit: 'large', comment: 'Beautiful silhouette and very comfy.' , helpful: 2, tags: ['Elegant'] },
      { rating: 4, author: 'Noah', date: '2024-07-03', fit: 'true', comment: 'Great quality, matches my decor.' , helpful: 3, tags: ['Great Service'] },
      { rating: 5, author: 'Mia', date: '2024-08-18', fit: 'small', comment: 'The boucle feels luxe and cozy.' , helpful: 4, tags: ['Eco-Friendly'] },
    ],
  }), [id])

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  // Reviews UI state
  const [viewLocal, setViewLocal] = useState(false)
  const [tab, setTab] = useState('all') // 'all' | 'image'
  const [ratingFilter, setRatingFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recommend')
  const [activeTag, setActiveTag] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const isInStock = product.stock > 0

  const averageRating = useMemo(() => {
    if (!product.reviews?.length) return 0
    const total = product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
    return Math.round((total / product.reviews.length) * 100) / 100
  }, [product.reviews])

  const handleAddToCart = () => {
    console.log('Add to cart', { id: product.id, color: selectedColor, quantity })
    alert('Added to cart! (placeholder)')
  }

  const decQty = () => setQuantity((q) => Math.max(1, q - 1))
  const incQty = () => setQuantity((q) => q + 1)

  // Derived filtered reviews
  const filteredReviews = useMemo(() => {
    let rows = [...(product.reviews || [])]
    if (tab === 'image') rows = rows.filter((r) => r.images?.length)
    if (ratingFilter !== 'all') rows = rows.filter((r) => r.rating >= Number(ratingFilter))
    if (colorFilter !== 'all') rows = rows.filter((r) => (r.color || '').toLowerCase() === colorFilter.toLowerCase())
    if (sizeFilter !== 'all') rows = rows.filter((r) => (r.size || '') === sizeFilter)
    if (activeTag) rows = rows.filter((r) => r.tags?.includes(activeTag))
    switch (sortBy) {
      case 'newest':
        rows.sort((a, b) => new Date(b.date) - new Date(a.date))
        break
      case 'rating':
        rows.sort((a, b) => b.rating - a.rating)
        break
      default:
        rows.sort((a, b) => (b.helpful || 0) - (a.helpful || 0))
    }
    return rows
  }, [product.reviews, tab, ratingFilter, colorFilter, sizeFilter, activeTag, sortBy])

  return (
    <div className="product-page" data-product-id={product.id}>
      <div className="product-page__top">
        {/* Left: Image gallery with vertical thumbnail rail */}
        <section className="product-gallery" aria-label="Product images">
          <div className="product-gallery__grid">
            <div className="thumb-rail" role="list">
              {product.images.map((img, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  className={`thumb ${selectedImage === idx ? 'is-active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img className="thumb__img" src={img.src} alt={img.alt || `Image ${idx + 1}`} />
                </button>
              ))}
            </div>
            <div className="product-gallery__main">
              <img
                className="product-gallery__img"
                src={product.images[selectedImage]?.src}
                alt={product.images[selectedImage]?.alt || product.name}
                style={{ '--img-fit': 'contain', '--img-pos': 'center' }}
              />
            </div>
          </div>
        </section>

        {/* Right: Product info */}
        <section className="product-info" aria-label="Product details">
          <h1 className="product-info__name">{product.name}</h1>
          <div className="product-info__by">by {product.designer}</div>

          <div className="product-info__price-row">
            <div className="product-info__price" aria-label={`Price ${product.price}`}>{formatCurrency(product.price)}</div>
            <a className="product-info__swatch" href={product.swatchUrl}>Request Free Swatch</a>
          </div>

          <div className="product-info__colors" aria-label="Choose a color">
            <span className="product-info__label">Color</span>
            <div className="color-swatches" role="group" aria-label="Color options">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${selectedColor === c ? 'is-selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="product-info__qty-row" aria-label="Quantity selector">
            <button className="qty-btn" type="button" onClick={decQty} aria-label="Decrease quantity" disabled={quantity <= 1}>−</button>
            <span className="qty-value" aria-live="polite">{quantity}</span>
            <button className="qty-btn" type="button" onClick={incQty} aria-label="Increase quantity">+</button>
            <div className="qty-total" aria-label="Total price">{formatCurrency(product.price * quantity)}</div>
          </div>

          <div className="product-info__actions product-info__actions--dual">
            <button className="btn btn-outline" type="button">BUY NOW</button>
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={!isInStock}
              aria-disabled={!isInStock ? 'true' : undefined}
            >
              ADD TO CART
            </button>
          </div>

          <p className="product-info__desc">{product.description}</p>

          <div className="product-info__shipping" aria-label="Shipping information">
            <span className="product-info__label">Shipping</span>
            <ul className="shipping-list">
              <li>Free shipping on orders over ${product.shipping?.freeShippingThreshold ?? 50}</li>
              <li>Estimated delivery: {product.shipping.deliveryEstimate}</li>
              <li>{product.shipping.returnsPolicy}</li>
            </ul>
          </div>

          {/* Accordions */}
          <div className="product-info__accordions">
            <AccordionItem title="Details">
              <ul>
                {product.details.map((d, i) => (<li key={`d-${i}`}>{d}</li>))}
              </ul>
            </AccordionItem>
            <AccordionItem title="Dimensions">
              <ul>
                {product.dimensions.map((d, i) => (<li key={`dim-${i}`}>{d}</li>))}
              </ul>
            </AccordionItem>
            <AccordionItem title="Care">
              <ul>
                {product.care.map((d, i) => (<li key={`care-${i}`}>{d}</li>))}
              </ul>
            </AccordionItem>
            <AccordionItem title="Sustainability">
              <ul>
                {product.sustainability.map((d, i) => (<li key={`sus-${i}`}>{d}</li>))}
              </ul>
            </AccordionItem>
          </div>
        </section>
      </div>

      {/* Bottom: Customer reviews */}
      <section className="reviews" aria-label="Customer reviews">
        <h2 className="reviews__title">Customer Reviews</h2>
        <div className="reviews__grid">
          <div className="reviews__left">
            {/* Tabs */}
            <div className="reviews__tabs">
              <button type="button" className={`reviews__tab ${tab === 'all' ? 'is-active' : ''}`} onClick={() => setTab('all')}>All Reviews</button>
              <button type="button" className={`reviews__tab ${tab === 'image' ? 'is-active' : ''}`} onClick={() => setTab('image')}>Image</button>
            </div>

            {/* Controls */}
            <div className="reviews__controls">
              <label>
                Rating
                <select className="form-select" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
              </label>
              <label>
                Color
                <select className="form-select" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="khaki">Khaki</option>
                  <option value="black">Black</option>
                  <option value="cream">Cream</option>
                </select>
              </label>
              <label>
                Size
                <select className="form-select" value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </label>
              <label>
                Sort by
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="rating">Rating</option>
                </select>
              </label>
            </div>

            {/* Tag chips */}
            <div className="reviews__chips">
              {product.reviewTags.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className={`chip ${activeTag === t.label ? 'is-active' : ''}`}
                  onClick={() => setActiveTag(activeTag === t.label ? null : t.label)}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {/* List */}
            {filteredReviews?.length ? (
              <ul className="reviews__list">
                {filteredReviews.map((r, i) => (
                  <ReviewCard key={`review-${i}`} review={r} />
                ))}
              </ul>
            ) : (
              <p className="reviews__empty">No reviews match your filters.</p>
            )}
          </div>

          <aside className="reviews__right">
            <div className="reviews__score">
              <span className="reviews__avg">{viewLocal ? product.localAverage : averageRating}</span>
              <StarRating rating={viewLocal ? product.localAverage : averageRating} />
            </div>
            <div className="reviews__local">
              <span>View Local Reviews <strong>{product.localAverage}</strong></span>
              <Toggle checked={viewLocal} onChange={setViewLocal} />
            </div>
            <div className="reviews__fit">
              <span className="reviews__fit-label">Overall Fit:</span>
              <FitBars stats={product.fitStats} />
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}