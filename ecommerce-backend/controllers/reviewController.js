import pool from "../config/db.js";

export const createReview = async (req, res) => {
  try {
    const { user_id, product_id, rating, comment } = req.body || {};

    const uid = parseInt(user_id, 10);
    const pid = parseInt(product_id, 10);
    const rate = parseInt(rating, 10);

    if (!uid || uid <= 0 || !pid || pid <= 0) {
      return res.status(400).json({ message: "Invalid user_id or product_id" });
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