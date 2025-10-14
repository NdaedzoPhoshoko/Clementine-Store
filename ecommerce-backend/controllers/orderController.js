import pool from "../config/db.js";

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { shipping } = req.body || {};
    const userId = parseInt(req.user?.id, 10);
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Find ACTIVE cart
    const cartRes = await client.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE user_id=$1 AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (cartRes.rows.length === 0) {
      return res.status(400).json({ message: "No ACTIVE cart found for user" });
    }
    const cart = cartRes.rows[0];

    // Ensure cart has items
    const itemsRes = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cart.id]
    );
    if (itemsRes.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Compute total
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(ci.quantity * p.price), 0) AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cart.id]
    );
    const total = Number(totalRes.rows[0].total);

    await client.query("BEGIN");

    // Create order in PENDING payment status
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_price, payment_status)
       VALUES ($1, $2, 'PENDING')
       RETURNING id, user_id, total_price, payment_status, created_at`,
      [userId, total]
    );
    const order = orderRes.rows[0];

    // Copy items from cart to order_items with price snapshot
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       SELECT $1, ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $2`,
      [order.id, cart.id]
    );

    // Optional shipping details
    if (shipping && shipping.name && shipping.address && shipping.city) {
      await client.query(
        `INSERT INTO shipping_details (order_id, user_id, name, address, city, province, postal_code, phone_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          userId,
          shipping.name,
          shipping.address,
          shipping.city,
          shipping.province || null,
          shipping.postal_code || null,
          shipping.phone_number || null,
        ]
      );
    }

    // Mark cart as CHECKOUT_IN_PROGRESS to prevent further edits
    await client.query("UPDATE cart SET status='CHECKOUT_IN_PROGRESS' WHERE id=$1", [cart.id]);

    await client.query("COMMIT");

    // Fetch order items and shipping for response
    const orderItemsRes = await pool.query(
      `SELECT oi.id AS order_item_id, oi.product_id, oi.quantity, oi.price,
              p.name, p.image_url
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [order.id]
    );
    const orderItems = orderItemsRes.rows;

    const shippingRes = await pool.query(
      `SELECT id, name, address, city, province, postal_code, phone_number, delivery_status
       FROM shipping_details
       WHERE order_id = $1`,
      [order.id]
    );
    const shippingDetails = shippingRes.rows[0] || null;

    const itemsCount = orderItems.reduce((acc, it) => acc + Number(it.quantity), 0);

    return res.status(201).json({
      order,
      items: orderItems,
      shipping: shippingDetails,
      meta: { itemsCount, total: Number(order.total_price) },
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Create order error:", err.message);
    return res.status(500).json({ message: "Error creating order" });
  } finally {
    client.release();
  }
};