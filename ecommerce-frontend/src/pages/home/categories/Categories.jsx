import './Categories.css'
import useFetchCategoriesWithImages from '../../../hooks/useFetchCategoriesWithImages.js'
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Match Navbar's slugify behavior for category filters
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

function CategoryCard({ name, image, isPlaceholder = false, onClick }) {
  const fallback = '/images/imageNoVnXXmDNi0.png';
  const src = image && image.length > 0 ? image : fallback;
  return (
    <button
      className={`cat-card ${isPlaceholder ? 'cat-card--skeleton' : ''}`}
      aria-label={isPlaceholder ? 'Loading category' : (name || 'Category')}
      disabled={isPlaceholder ? true : undefined}
      onClick={isPlaceholder ? undefined : onClick}
    >
      <span className="cat-card__avatar" aria-hidden>
        {isPlaceholder ? (
          <span className="cat-card__avatar-skeleton skeleton-block" />
        ) : (
          <img className="cat-card__img" src={src} alt="" />
        )}
      </span>
      <span className="cat-card__name">
        {isPlaceholder ? (
          <span className="cat-card__name-skeleton skeleton-block" aria-hidden="true"></span>
        ) : (
          name || '...'
        )}
      </span>
    </button>
  );
}

export default function Categories({ onError }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [page, setPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [cats, setCats] = useState([]);
  const [unitX, setUnitX] = useState(236); // card width + gap in px

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

  // Prefetch next page when near end of current buffer
  const nearEndIndex = useMemo(() => offset + itemsPerView, [offset, itemsPerView]);
  useEffect(() => {
    const needMore = nearEndIndex >= cats.length && !loading;
    if (needMore) setPage((p) => p + 1);
  }, [nearEndIndex, cats.length, loading]);

  const handleNext = () => {
    const nextOffset = offset + itemsPerView;
    const max = Math.max(0, cats.length - itemsPerView);
    const clamped = Math.min(nextOffset, max);
    setOffset(clamped);
    const remainingAhead = cats.length - (clamped + itemsPerView);
    if (remainingAhead <= itemsPerView && !loading) {
      setPage((p) => p + 1);
    }
  };

  const handlePrev = () => {
    setOffset((o) => Math.max(0, o - itemsPerView));
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

        <div className="home-categories__track" ref={trackRef}>
          <div className="home-categories__list" style={{ transform: `translateX(-${offset * unitX}px)` }}>
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
                />
              );
            })}
          </div>
        </div>

        <button
          className="home-categories__btn home-categories__btn--next"
          onClick={handleNext}
          aria-label="Next categories"
          disabled={loading && cats.length <= offset + itemsPerView}
        >
          ›
        </button>
      </div>
    </section>
  )
}