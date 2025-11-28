import pool from "../config/db.js";

export const createOrUpdateShippingDetails = async (req, res) => {
  try {
    const { order_id, name, address, city, province, postal_code, phone_number } = req.body || {};

    const userId = parseInt(req.user?.id, 10);
    const orderId = parseInt(order_id, 10);

    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!orderId || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order_id" });
    }
    if (!name || !address || !city) {
      return res.status(400).json({ message: "Missing required shipping fields: name, address, city" });
    }

    const orderRes = await pool.query(
      "SELECT id, user_id, payment_status FROM orders WHERE id=$1",
      [orderId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orderRes.rows[0];
    if (order.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: order does not belong to user" });
    }

    // Upsert shipping details: update if exists, else insert
    const existingRes = await pool.query(
      "SELECT id FROM shipping_details WHERE order_id=$1",
      [orderId]
    );

    let shipping;
    if (existingRes.rows.length > 0) {
      const updRes = await pool.query(
        `UPDATE shipping_details
         SET name=$1, address=$2, city=$3, province=$4, postal_code=$5, phone_number=$6
         WHERE order_id=$7
         RETURNING id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status`,
        [name, address, city, province || null, postal_code || null, phone_number || null, orderId]
      );
      shipping = updRes.rows[0];
    } else {
      const insRes = await pool.query(
        `INSERT INTO shipping_details (order_id, user_id, name, address, city, province, postal_code, phone_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status`,
        [orderId, userId, name, address, city, province || null, postal_code || null, phone_number || null]
      );
      shipping = insRes.rows[0];
    }

    return res.status(201).json({ shipping });
  } catch (err) {
    console.error("Create/Update shipping details error:", err.message);
    return res.status(500).json({ message: "Error saving shipping details" });
  }
};

export const getShippingDetails = async (req, res) => {
  try {
    const { user_id, order_id, page = 1, limit = 20 } = req.query || {};

    const tokenUserId = parseInt(req.user?.id, 10);
    const userIdQuery = user_id ? parseInt(user_id, 10) : undefined;
    const orderId = order_id ? parseInt(order_id, 10) : undefined;

    if (!tokenUserId && !orderId) {
      return res.status(400).json({ message: "Provide user_id or order_id" });
    }

    if (orderId) {
      const shipRes = await pool.query(
        `SELECT id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status
         FROM shipping_details WHERE order_id=$1`,
        [orderId]
      );
      if (shipRes.rows.length === 0) {
        return res.status(404).json({ message: "Shipping details not found for order" });
      }
      const shipping = shipRes.rows[0];
      // If caller is not admin, enforce ownership
      const isAdmin = await isAdminUser(tokenUserId);
      if (!isAdmin && shipping.user_id !== tokenUserId) {
        return res.status(403).json({ message: "Forbidden: order does not belong to user" });
      }
      return res.status(200).json({ shipping });
    }

    // If only userId is provided, list all shipping details for the user
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    // Admin can fetch any user_id; non-admin must use token user id
    const isAdmin = await isAdminUser(tokenUserId);
    const effectiveUserId = isAdmin && userIdQuery ? userIdQuery : tokenUserId;

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM shipping_details WHERE user_id=$1`,
      [effectiveUserId]
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const itemsRes = await pool.query(
      `SELECT id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status
       FROM shipping_details
       WHERE user_id=$1
       ORDER BY id DESC
       LIMIT $2 OFFSET $3`,
      [effectiveUserId, limitNum, offset]
    );

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    return res.status(200).json({
      items: itemsRes.rows,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("Get shipping details error:", err.message);
    return res.status(500).json({ message: "Error fetching shipping details" });
  }
};

export const getMyShippingDetails = async (req, res) => {
  try {
    const tokenUserId = parseInt(req.user?.id, 10);
    if (!tokenUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const { page = 1, limit = 20 } = req.query || {};
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM shipping_details WHERE user_id=$1`,
      [tokenUserId]
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const itemsRes = await pool.query(
      `SELECT id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status
       FROM shipping_details
       WHERE user_id=$1
       ORDER BY id DESC
       LIMIT $2 OFFSET $3`,
      [tokenUserId, limitNum, offset]
    );

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    return res.status(200).json({
      items: itemsRes.rows,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("Get my shipping details error:", err.message);
    return res.status(500).json({ message: "Error fetching shipping details" });
  }
};

// Helper: lightweight admin check leveraging middleware settings
const isAdminUser = async (userId) => {
  try {
    if (!userId) return false;
    const ids = String(process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => Number.isInteger(v) && v > 0);
    if (ids.includes(Number(userId))) return true;

    const emails = String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);
    if (emails.length > 0) {
      const res = await pool.query("SELECT email FROM users WHERE id=$1", [userId]);
      const email = res.rows[0]?.email;
      if (email && emails.includes(email)) return true;
    }
  } catch (_) {}
  return false;
};

export const getShippingReuseOptions = async (req, res) => {
  try {
    const tokenUserId = parseInt(req.user?.id, 10);
    if (!tokenUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const q = `
      WITH norm AS (
        SELECT id,
               user_id,
               NULLIF(LOWER(TRIM(city)), '') AS city_norm,
               NULLIF(LOWER(TRIM(province)), '') AS province_norm,
               NULLIF(TRIM(postal_code), '') AS postal_norm,
               city, province, postal_code
        FROM shipping_details
        WHERE user_id = $1
      )
      SELECT DISTINCT ON (city_norm, province_norm, postal_norm)
             city, province, postal_code
      FROM norm
      WHERE city_norm IS NOT NULL OR province_norm IS NOT NULL OR postal_norm IS NOT NULL
      ORDER BY city_norm, province_norm, postal_norm, id DESC
    `;
    const result = await pool.query(q, [tokenUserId]);
    const items = result.rows.map((r) => ({
      city: r.city || null,
      province: r.province || null,
      postal_code: r.postal_code || null,
    }));
    return res.status(200).json({ items });
  } catch (err) {
    console.error("Get shipping reuse options error:", err.message);
    return res.status(500).json({ message: "Error fetching shipping reuse options" });
  }
};
