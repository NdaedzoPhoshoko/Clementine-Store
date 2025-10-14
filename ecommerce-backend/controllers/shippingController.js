import pool from "../config/db.js";

export const createOrUpdateShippingDetails = async (req, res) => {
  try {
    const { user_id, order_id, name, address, city, province, postal_code, phone_number } = req.body || {};

    const userId = parseInt(user_id, 10);
    const orderId = parseInt(order_id, 10);

    if (!userId || userId <= 0) {
      return res.status(400).json({ message: "Invalid user_id" });
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

    const userId = user_id ? parseInt(user_id, 10) : undefined;
    const orderId = order_id ? parseInt(order_id, 10) : undefined;

    if (!userId && !orderId) {
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
      if (userId && shipping.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden: order does not belong to user" });
      }
      return res.status(200).json({ shipping });
    }

    // If only userId is provided, list all shipping details for the user
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM shipping_details WHERE user_id=$1`,
      [userId]
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const itemsRes = await pool.query(
      `SELECT id, order_id, user_id, name, address, city, province, postal_code, phone_number, delivery_status
       FROM shipping_details
       WHERE user_id=$1
       ORDER BY id DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offset]
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