import './Categories.css'
import useFetchCategoriesWithImages from '../../../hooks/useFetchCategoriesWithImages.js'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Match Navbar's slugify behavior for category filters
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

function CategoryCard({ name, image, isPlaceholder = false, onClick, delayMs = 0 }) {
  const fallback = '/images/imageNoVnXXmDNi0.png';
  const src = image && image.length > 0 ? image : fallback;
  return (
    <div
      className={`cat-card ${isPlaceholder ? 'cat-card--skeleton' : ''}`}
      aria-label={isPlaceholder ? 'Loading category' : (name || 'Category')}
      onClick={isPlaceholder ? undefined : onClick}
      role="button"
      tabIndex={isPlaceholder ? -1 : 0}
      onKeyDown={(e) => {
        if (!isPlaceholder && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      style={isPlaceholder ? undefined : { animationDelay: `${delayMs}ms` }}
    >
      <div className="cat-card__image-container">
        {isPlaceholder ? (
          <div className="cat-card__img-skeleton skeleton-block" />
        ) : (
          <img className="cat-card__img" src={src} alt="" />
        )}
      </div>
      <div className="cat-card__overlay">
        <span className="cat-card__name">
          {isPlaceholder ? (
            <span className="cat-card__name-skeleton skeleton-block" aria-hidden="true"></span>
          ) : (
            <span className="cat-card__name-default">{name || 'Category'}</span>
          )}
        </span>
        {!isPlaceholder && (
          <span className="cat-card__hover-center">Browse</span>
        )}
      </div>
    </div>
  );
}

export default function Categories({ onError }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const listRef = useRef(null);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [cats, setCats] = useState([]);
  const [unitX, setUnitX] = useState(174); // card width (150) + gap (24) in px
  const [entered, setEntered] = useState(false);

  const navigate = useNavigate();

  const { categories, loading, error } = useFetchCategoriesWithImages({ page, limit: itemsPerView * 2 });

  const lastErrMsgRef = useRef(null);
  useEffect(() => {
    if (error && typeof onError === 'function') {
      const msg = typeof error === 'string' ? error : error?.message || String(error);
      if (lastErrMsgRef.current !== msg) {
        lastErrMsgRef.current = msg;
        onError(error);
      }
    }
  }, [error]);

  // Merge newly fetched categories (dedupe by id)
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setCats((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]));
        for (const c of categories) byId.set(c.id, c);
        return Array.from(byId.values());
      });
    }
  }, [categories]);

  // Measure card width + gap to compute unitX and itemsPerView responsively
  useEffect(() => {
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl) return;
    const measure = () => {
      const cardEl = trackEl.querySelector('.cat-card');
      const listEl = trackEl.querySelector('.home-categories__list');
      const cardW = cardEl ? cardEl.offsetWidth : 150;
      const gapStr = listEl ? getComputedStyle(listEl).gap : (getComputedStyle(trackEl).gap || '86px');
      const gap = parseInt(gapStr, 10) || 86;
      const unit = cardW + gap;
      setUnitX(unit);
      const width = trackEl.clientWidth || viewportEl.clientWidth || 0;
      const next = Math.max(3, Math.floor(width / unit));
      setItemsPerView(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewportEl);
    ro.observe(trackEl);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        obs.disconnect();
      }
    }, { threshold: 0.15, root: null, rootMargin: '0px 0px -10% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Prefetch next page when near end of current buffer
  const nearEndIndex = useMemo(() => offset + itemsPerView, [offset, itemsPerView]);
  useEffect(() => {
    const needMore = nearEndIndex >= cats.length && !loading;
    if (needMore) setPage((p) => p + 1);
  }, [nearEndIndex, cats.length, loading]);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || unitX <= 0) return;
    const x = el.scrollLeft;
    const next = Math.round(x / unitX);
    if (next !== offset) setOffset(next);
  }, [unitX, offset]);

  const handleNext = () => {
    const nextOffset = offset + itemsPerView;
    const max = Math.max(0, cats.length - itemsPerView);
    const clamped = Math.min(nextOffset, max);
    const el = trackRef.current;
    if (el) {
      try { el.scrollTo({ left: clamped * unitX, behavior: 'smooth' }); } catch (_) { el.scrollLeft = clamped * unitX; }
    }
    setOffset(clamped);
    const remainingAhead = cats.length - (clamped + itemsPerView);
    if (remainingAhead <= itemsPerView && !loading) {
      setPage((p) => p + 1);
    }
  };

  const handlePrev = () => {
    const prev = Math.max(0, offset - itemsPerView);
    const el = trackRef.current;
    if (el) {
      try { el.scrollTo({ left: prev * unitX, behavior: 'smooth' }); } catch (_) { el.scrollLeft = prev * unitX; }
    }
    setOffset(prev);
  };

  const placeholders = Array.from({ length: itemsPerView }, (_, i) => ({ id: `ph-${i}`, name: '...', image: '' }));
  const renderList = cats.length > 0 ? cats : placeholders;

  return (
    <section className="home-categories" aria-labelledby="home-categories-title">
      <div className="home-categories__header">
        <h2 id="home-categories-title" className="home-categories__title">Shop by Category</h2>
      </div>

      <div ref={viewportRef} className="home-categories__viewport" aria-busy={loading} aria-live="polite">
        <button
          className="home-categories__btn home-categories__btn--prev"
          onClick={handlePrev}
          aria-label="Previous categories"
          disabled={offset === 0}
        >
          ‹
        </button>

        <div className="home-categories__track" ref={trackRef} onScroll={handleScroll}>
          <div ref={listRef} className={`home-categories__list ${entered ? 'is-entered' : ''}`}>
            {renderList.map((c, i) => {
              const isPh = String(c.id || '').startsWith('ph-');
              const label = c.name || '';
              const onCardClick = () => {
                if (!isPh && label.trim()) {
                  navigate(`/shop-all?category=${slugify(label)}`);
                }
              };
              return (
                <CategoryCard
                  key={c.id ?? `${offset}-${i}`}
                  name={c.name}
                  image={c.image}
                  isPlaceholder={isPh}
                  onClick={onCardClick}
                  delayMs={i * 80}
                />
              );
            })}
          </div>
        </div>

        <button
          className="home-categories__btn home-categories__btn--next"
          onClick={handleNext}
          aria-label="Next categories"
          disabled={offset >= Math.max(0, cats.length - itemsPerView)}
        >
          ›
        </button>
      </div>
    </section>
  )
}
