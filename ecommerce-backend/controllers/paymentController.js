import pool from "../config/db.js";

export const createPayment = async (req, res) => {
  try {
    const { user_id, order_id, amount, method } = req.body || {};
    const userId = parseInt(user_id, 10);
    const orderId = parseInt(order_id, 10);
    const amt = Number(amount);

    if (!userId || userId <= 0) {
      return res.status(400).json({ message: "Invalid user_id" });
    }
    if (!orderId || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order_id" });
    }
    if (!method || typeof method !== "string") {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Verify order ownership and status
    const orderRes = await pool.query(
      "SELECT id, user_id, total_price, payment_status FROM orders WHERE id=$1",
      [orderId]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orderRes.rows[0];
    if (order.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: order does not belong to user" });
    }
    if (order.payment_status === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // Amount must match order total
    const orderTotal = Number(order.total_price);
    if (Number(amt.toFixed(2)) !== Number(orderTotal.toFixed(2))) {
      return res.status(400).json({ message: "Amount must equal order total_price" });
    }

    // Create a stub transaction_id; real gateway would provide this
    const transactionId = `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const paymentRes = await pool.query(
      `INSERT INTO payments (order_id, amount, method, transaction_id, payment_status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id, order_id, amount, method, transaction_id, payment_status, created_at`,
      [orderId, amt, method, transactionId]
    );
    const payment = paymentRes.rows[0];

    // Do NOT mark the order as PAID here. A gateway webhook/callback should do that.
    return res.status(201).json({ payment });
  } catch (err) {
    console.error("Create payment error:", err.message);
    return res.status(500).json({ message: "Error creating payment" });
  }
};

export const getPaymentByTransactionId = async (req, res) => {
  try {
    const { transaction_id } = req.params || {};
    const txId = String(transaction_id || '').trim();
    if (!txId) {
      return res.status(400).json({ message: "Invalid transaction_id" });
    }

    const paymentRes = await pool.query(
      `SELECT p.id, p.order_id, p.amount, p.method, p.transaction_id, p.payment_status, p.created_at,
              o.user_id, o.total_price, o.payment_status AS order_payment_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.transaction_id = $1`,
      [txId]
    );
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }
    const row = paymentRes.rows[0];
    const payment = {
      id: row.id,
      order_id: row.order_id,
      amount: Number(row.amount),
      method: row.method,
      transaction_id: row.transaction_id,
      payment_status: row.payment_status,
      created_at: row.created_at,
    };
    const order = {
      id: row.order_id,
      user_id: row.user_id,
      total_price: Number(row.total_price),
      payment_status: row.order_payment_status,
    };

    return res.status(200).json({ payment, order });
  } catch (err) {
    console.error("Get payment error:", err.message);
    return res.status(500).json({ message: "Error fetching payment" });
  }
};