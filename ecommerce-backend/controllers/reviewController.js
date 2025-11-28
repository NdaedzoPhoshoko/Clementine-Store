import pool from "../config/db.js";

export const createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body || {};

    const uid = parseInt(req.user?.id, 10);
    const pid = parseInt(product_id, 10);
    const rate = parseInt(rating, 10);

    if (!uid || uid <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!pid || pid <= 0) {
      return res.status(400).json({ message: "Invalid product_id" });
    }
    if (!rate || rate < 1 || rate > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    // Ensure user exists
    const userRes = await pool.query("SELECT id FROM users WHERE id=$1", [uid]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure product exists
    const productRes = await pool.query("SELECT id FROM products WHERE id=$1", [pid]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if review already exists for (user_id, product_id)
    const existsRes = await pool.query(
      "SELECT id FROM reviews WHERE user_id=$1 AND product_id=$2",
      [uid, pid]
    );
    if (existsRes.rows.length > 0) {
      return res.status(409).json({ message: "Review by this user for this product already exists" });
    }

    const insertRes = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, product_id, rating, comment, created_at`,
      [uid, pid, rate, comment || null]
    );
    const review = insertRes.rows[0];

    // Compute updated stats for the product
    const statsRes = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [pid]
    );
    const stats = {
      averageRating: parseFloat(statsRes.rows[0].average_rating),
      reviewCount: parseInt(statsRes.rows[0].review_count, 10),
    };

    return res.status(201).json({ review, stats });
  } catch (err) {
    console.error("Create review error:", err.message);
    return res.status(500).json({ message: "Error creating review" });
  }
};

export const getReviews = async (req, res) => {
  try {
    const pid = parseInt(req.query?.product_id, 10);
    if (!pid || pid <= 0) {
      return res.status(400).json({ message: "Invalid product_id" });
    }

    const itemsRes = await pool.query(
      `SELECT id, user_id, product_id, rating, comment, created_at
       FROM reviews
       WHERE product_id=$1
       ORDER BY created_at DESC`,
      [pid]
    );
    const items = itemsRes.rows;

    const statsRes = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [pid]
    );
    const stats = {
      averageRating: parseFloat(statsRes.rows[0].average_rating),
      reviewCount: parseInt(statsRes.rows[0].review_count, 10),
    };

    const uid = parseInt(req.user?.id, 10);
    let haveOrdered = "require signin";
    if (uid && uid > 0) {
      const ordRes = await pool.query(
        `SELECT 1
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = $1 AND oi.product_id = $2
         LIMIT 1`,
        [uid, pid]
      );
      haveOrdered = ordRes.rows.length > 0 ? "ordered" : "not ordered";
    }

    return res.status(200).json({ items, stats, haveOrdered });
  } catch (err) {
    console.error("Get reviews error:", err.message);
    return res.status(500).json({ message: "Error fetching reviews" });
  }
};
