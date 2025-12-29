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

export const getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      rating,
      product_id,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let whereClauses = ["1=1"];

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(p.name ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (rating) {
        params.push(rating);
        whereClauses.push(`r.rating = $${params.length}`);
    }

    if (product_id) {
        params.push(product_id);
        whereClauses.push(`r.product_id = $${params.length}`);
    }

    if (startDate) {
        params.push(startDate);
        whereClauses.push(`r.created_at >= $${params.length}`);
    }

    if (endDate) {
        params.push(endDate);
        whereClauses.push(`r.created_at <= $${params.length}`);
    }

    // Sort mapping
    const validSorts = ["created_at", "rating", "product_name", "user_name"];
    const sortCol = validSorts.includes(sortBy) ? sortBy : "created_at";
    // Map friendly names to DB columns
    const sortMap = {
        created_at: "r.created_at",
        rating: "r.rating",
        product_name: "p.name",
        user_name: "u.name"
    };
    const finalSort = sortMap[sortCol];
    const finalOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    const whereSql = whereClauses.join(" AND ");

    const query = `
      SELECT r.*,
             p.name as product_name,
             p.image_url as product_image,
             u.name as user_name,
             u.email as user_email
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE ${whereSql}
      ORDER BY ${finalSort} ${finalOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE ${whereSql}
    `;

    const [reviewsRes, countRes, statsRes] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
      pool.query(`SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating`)
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    
    // Process stats
    let totalRatingSum = 0;
    let totalCount = 0;
    const distribution = [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
    ];

    statsRes.rows.forEach(row => {
        const r = parseInt(row.rating, 10);
        const c = parseInt(row.count, 10);
        if (r >= 1 && r <= 5) {
            distribution[5 - r].count = c; // 5->index 0, 1->index 4
            totalRatingSum += r * c;
            totalCount += c;
        }
    });

    const average = totalCount > 0 ? totalRatingSum / totalCount : 0;

    return res.status(200).json({
      reviews: reviewsRes.rows,
      meta: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limit),
      },
      stats: {
          total: totalCount,
          average,
          distribution
      }
    });

  } catch (err) {
    console.error("Get all reviews error:", err.message);
    return res.status(500).json({ message: "Error fetching reviews" });
  }
};

export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!id) return res.status(400).json({ message: "Review ID is required" });

        // Build dynamic update
        const updates = [];
        const values = [];
        let idx = 1;

        if (rating !== undefined) {
            const rateVal = parseInt(rating, 10);
            if (rateVal < 1 || rateVal > 5) {
                return res.status(400).json({ message: "Rating must be between 1 and 5" });
            }
            updates.push(`rating = $${idx++}`);
            values.push(rateVal);
        }

        if (comment !== undefined) {
            updates.push(`comment = $${idx++}`);
            values.push(comment);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        values.push(id);
        const query = `
            UPDATE reviews
            SET ${updates.join(", ")}
            WHERE id = $${idx}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        return res.status(200).json({ review: result.rows[0], message: "Review updated successfully" });

    } catch (err) {
        console.error("Update review error:", err.message);
        return res.status(500).json({ message: "Error updating review" });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM reviews WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }
        return res.status(200).json({ message: "Review deleted successfully", review: result.rows[0] });
    } catch (err) {
        console.error("Delete review error:", err.message);
        return res.status(500).json({ message: "Error deleting review" });
    }
};
