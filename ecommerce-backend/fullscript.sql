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