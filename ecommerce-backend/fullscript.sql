-- Ensure timezone is set to South Africa
SET TIME ZONE 'Africa/Johannesburg';

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

UPDATE users SET token_version = 0 WHERE token_version IS NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMPTZ;

-- CATEGORIES TABLE
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- PRODUCTS TABLE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(255),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- CART TABLE
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CART ITEMS
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- ORDERS
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

-- SHIPPING DETAILS
CREATE TABLE shipping_details (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    postal_code VARCHAR(20),
    phone_number VARCHAR(20),
    delivery_status VARCHAR(50) DEFAULT 'Pending'
);

-- PAYMENTS
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT IMAGES
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL
);

-- Add public_id column to product_images to store Cloudinary asset identifier
ALTER TABLE product_images
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);

-- Optional index to speed up lookups by public_id (useful for deletes/management)
CREATE INDEX IF NOT EXISTS idx_product_images_public_id ON product_images(public_id);

-- Note: Existing rows will have NULL public_id. New uploads should populate this field.

UPDATE product_images SET public_id = regexp_replace(   regexp_replace(     regexp_replace(image_url, '^.*\\/upload\\/', ''),     '^([^\\/]+\\/)*v[0-9]+\\/',     ''   ),   '\\.[^\\/.]+$',   '' ) WHERE public_id IS NULL AND image_url LIKE '%/upload/%';


-- REVIEWS
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- INVENTORY LOG
CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_type VARCHAR(50), -- e.g. 'SALE', 'RESTOCK'
    quantity_changed INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional indexes for performance
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_order_user ON orders(user_id);
CREATE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_review_product ON reviews(product_id);
CREATE INDEX idx_product_category ON products(category_id);

-- Full-text search indexes for products names, descriptions and categories
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_lower_name_trgm
  ON products USING gin ((lower(name)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_lower_description_trgm
  ON products USING gin ((lower(description)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_lower_name_trgm
  ON categories USING gin ((lower(name)) gin_trgm_ops);

  -- additional details script

  BEGIN;

-- Add optional JSONB columns for extra product info
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS dimensions JSONB,
  ADD COLUMN IF NOT EXISTS care_notes JSONB,
  ADD COLUMN IF NOT EXISTS sustainability_notes JSONB;

-- Optional: lightweight type checks (arrays or objects).
-- Note: PostgreSQL doesn't support IF NOT EXISTS for constraints; use DO blocks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_details_jsonb_type'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_details_jsonb_type
      CHECK (details IS NULL OR jsonb_typeof(details) IN ('array','object'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_dimensions_jsonb_type'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_dimensions_jsonb_type
      CHECK (dimensions IS NULL OR jsonb_typeof(dimensions) IN ('array','object'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_care_notes_jsonb_type'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_care_notes_jsonb_type
      CHECK (care_notes IS NULL OR jsonb_typeof(care_notes) IN ('array','object'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sustainability_notes_jsonb_type'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_sustainability_notes_jsonb_type
      CHECK (sustainability_notes IS NULL OR jsonb_typeof(sustainability_notes) IN ('array','object'));
  END IF;
END
$$;

-- Optional: trigram indexes to search text within these fields.
 CREATE EXTENSION IF NOT EXISTS pg_trgm;
 CREATE INDEX IF NOT EXISTS idx_products_details_trgm
 ON products USING gin ((details::text) gin_trgm_ops);
 CREATE INDEX IF NOT EXISTS idx_products_dimensions_trgm
 ON products USING gin ((dimensions::text) gin_trgm_ops);
 CREATE INDEX IF NOT EXISTS idx_products_care_notes_trgm
 ON products USING gin ((care_notes::text) gin_trgm_ops);
 CREATE INDEX IF NOT EXISTS idx_products_sustainability_notes_trgm
 ON products USING gin ((sustainability_notes::text) gin_trgm_ops);

COMMIT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_variants JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_color_variants_jsonb_type'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_color_variants_jsonb_type
      CHECK (color_variants IS NULL OR jsonb_typeof(color_variants) IN ('array','object'));
  END IF;
END
$$;