import pool from "../config/db.js";

export const listProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      whereClauses.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    }

    if (categoryId) {
      params.push(parseInt(categoryId, 10));
      whereClauses.push(`category_id = $${params.length}`);
    }

    if (minPrice) {
      params.push(parseFloat(minPrice));
      whereClauses.push(`price >= $${params.length}`);
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      whereClauses.push(`price <= $${params.length}`);
    }

    if (typeof inStock !== "undefined") {
      const wantInStock = String(inStock).toLowerCase() === "true";
      if (wantInStock) {
        whereClauses.push(`stock > 0`);
      }
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // total count
    const countQuery = `SELECT COUNT(*) AS total FROM products ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // items query
    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT id, name, description, price, image_url, stock, category_id
      FROM products
      ${whereSql}
      ORDER BY id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("List products error:", err.message);
    return res.status(500).json({ message: "Error fetching products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const productQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id,
             c.name AS category_name, c.description AS category_description
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `;
    const productResult = await pool.query(productQuery, [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const p = productResult.rows[0];

    const imagesResult = await pool.query(
      "SELECT image_url FROM product_images WHERE product_id=$1 ORDER BY id ASC",
      [id]
    );
    const images = imagesResult.rows.map((r) => r.image_url);

    const reviewsResult = await pool.query(
      "SELECT id, user_id, rating, comment, created_at FROM reviews WHERE product_id=$1 ORDER BY created_at DESC",
      [id]
    );
    const reviews = reviewsResult.rows;

    const statsResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [id]
    );
    const reviewStats = {
      averageRating: parseFloat(statsResult.rows[0].average_rating),
      reviewCount: parseInt(statsResult.rows[0].review_count, 10),
    };

    return res.status(200).json({
      product: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        stock: p.stock,
      },
      category: p.category_id
        ? { id: p.category_id, name: p.category_name, description: p.category_description }
        : null,
      images,
      reviews,
      reviewStats,
    });
  } catch (err) {
    console.error("Get product error:", err.message);
    return res.status(500).json({ message: "Error fetching product details" });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    // Verify product exists to return 404 if not
    const productExists = await pool.query("SELECT id FROM products WHERE id=$1", [id]);
    if (productExists.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch reviews with basic user info
    const reviewsQuery = `
      SELECT r.id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `;
    const reviewsResult = await pool.query(reviewsQuery, [id]);
    const reviews = reviewsResult.rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user_name || null,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    }));

    const statsResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [id]
    );
    const stats = {
      averageRating: parseFloat(statsResult.rows[0].average_rating),
      reviewCount: parseInt(statsResult.rows[0].review_count, 10),
    };

    return res.status(200).json({ reviews, stats });
  } catch (err) {
    console.error("Get product reviews error:", err.message);
    return res.status(500).json({ message: "Error fetching product reviews" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url, stock, category_id } = req.body || {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const priceNum = parseFloat(price);
    const stockNum = typeof stock !== "undefined" ? parseInt(stock, 10) : 0;
    const categoryIdNum = typeof category_id !== "undefined" && category_id !== null ? parseInt(category_id, 10) : null;

    if (!trimmedName) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: "Stock must be a non-negative integer" });
    }

    if (categoryIdNum !== null) {
      const catRes = await pool.query("SELECT id FROM categories WHERE id=$1", [categoryIdNum]);
      if (catRes.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const insertQuery = `
      INSERT INTO products (name, description, price, image_url, stock, category_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, price, image_url, stock, category_id
    `;
    const insertParams = [
      trimmedName,
      description || null,
      priceNum,
      image_url || null,
      stockNum,
      categoryIdNum,
    ];
    const result = await pool.query(insertQuery, insertParams);
    const product = result.rows[0];

    return res.status(201).json({ product });
  } catch (err) {
    console.error("Create product error:", err.message);
    return res.status(500).json({ message: "Error creating product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, description, price, image_url, stock, category_id FROM products WHERE id=$1",
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existing = existingRes.rows[0];

    const { name, description, price, image_url, stock, category_id } = req.body || {};

    // Validate provided fields only
    if (typeof name !== "undefined") {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Product name cannot be empty" });
      }
      existing.name = trimmedName;
    }

    if (typeof description !== "undefined") {
      existing.description = description || null;
    }

    if (typeof price !== "undefined") {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number" });
      }
      existing.price = priceNum;
    }

    if (typeof image_url !== "undefined") {
      existing.image_url = image_url || null;
    }

    if (typeof stock !== "undefined") {
      const stockNum = parseInt(stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ message: "Stock must be a non-negative integer" });
      }
      existing.stock = stockNum;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "category_id")) {
      // Allow setting to null or a valid category id
      if (category_id === null || typeof category_id === "undefined") {
        existing.category_id = null;
      } else {
        const categoryIdNum = parseInt(category_id, 10);
        if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
          return res.status(400).json({ message: "Invalid category_id" });
        }
        const catRes = await pool.query("SELECT id FROM categories WHERE id=$1", [categoryIdNum]);
        if (catRes.rows.length === 0) {
          return res.status(404).json({ message: "Category not found" });
        }
        existing.category_id = categoryIdNum;
      }
    }

    const updateQuery = `
      UPDATE products
      SET name=$1, description=$2, price=$3, image_url=$4, stock=$5, category_id=$6
      WHERE id=$7
      RETURNING id, name, description, price, image_url, stock, category_id
    `;
    const updateParams = [
      existing.name,
      existing.description,
      existing.price,
      existing.image_url,
      existing.stock,
      existing.category_id,
      id,
    ];
    const result = await pool.query(updateQuery, updateParams);
    const product = result.rows[0];

    return res.status(200).json({ product });
  } catch (err) {
    console.error("Update product error:", err.message);
    return res.status(500).json({ message: "Error updating product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, description, price, image_url, stock, category_id FROM products WHERE id=$1",
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = existingRes.rows[0];

    await pool.query("DELETE FROM products WHERE id=$1", [id]);

    return res.status(200).json({ message: "Product deleted", product });
  } catch (err) {
    console.error("Delete product error:", err.message);
    return res.status(500).json({ message: "Error deleting product" });
  }
};