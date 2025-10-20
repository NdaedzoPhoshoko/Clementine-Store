-- Index recommendations to keep autocomplete fast when matching
-- product names, descriptions, and category names by prefix.

-- Enable trigram extension for fast LIKE/ILIKE prefix matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Products: index lower(name) and lower(description) with trigram GIN.
-- These expression indexes are used by queries like:
--   LOWER(p.name) LIKE LOWER($1) || '%'
--   LOWER(p.description) LIKE LOWER($1) || '%'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_lower_name_trgm
  ON products USING gin ((lower(name)) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_lower_description_trgm
  ON products USING gin ((lower(description)) gin_trgm_ops);

-- Categories: index lower(name) for joins in autocomplete.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_lower_name_trgm
  ON categories USING gin ((lower(name)) gin_trgm_ops);

-- Optional: if you also search category description prefixes, add:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_lower_description_trgm
--   ON categories USING gin ((lower(description)) gin_trgm_ops);

-- Verification examples:
-- EXPLAIN ANALYZE
--   SELECT DISTINCT p.name
--   FROM products p
--   LEFT JOIN categories c ON c.id = p.category_id
--   WHERE lower(p.name) LIKE lower('ap') || '%'
--      OR lower(p.description) LIKE lower('ap') || '%'
--      OR lower(c.name) LIKE lower('ap') || '%'
--   ORDER BY p.name ASC
--   LIMIT 10;