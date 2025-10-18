import './Categories.css'
import useFetchCategoriesWithImages from '../../../hooks/useFetchCategoriesWithImages.js'

function CategoryCard({ name, image }) {
  const fallback = '/images/imageNoVnXXmDNi0.png'
  const src = image && image.length > 0 ? image : fallback
  return (
    <button className="cat-card" aria-label={name || 'Category'}>
      <span className="cat-card__avatar" aria-hidden>
        <img className="cat-card__img" src={src} alt="" />
      </span>
      <span className="cat-card__name">{name || '...'}</span>
    </button>
  )
}

export default function Categories() {
  const { categories, loading, error } = useFetchCategoriesWithImages({ page: 1, limit: 10 })

  // Ensure we render a full two-row grid even while loading
  const placeholders = Array.from({ length: 10 }, (_, i) => ({ id: `ph-${i}`, name: '...', image: '' }))
  const list = Array.isArray(categories) && categories.length > 0 ? categories : placeholders

  return (
    <section className="home-categories" aria-labelledby="home-categories-title">
      <h2 id="home-categories-title" className="home-categories__title">Shop by Category</h2>
      <div className="home-categories__grid" aria-busy={loading} aria-live="polite">
        {list.map((c, i) => (
          <CategoryCard key={c.id ?? i} name={c.name} image={c.image} />
        ))}
      </div>
      {error && (
        <div role="alert" className="home-categories__error">Failed to load categories.</div>
      )}
    </section>
  )
}