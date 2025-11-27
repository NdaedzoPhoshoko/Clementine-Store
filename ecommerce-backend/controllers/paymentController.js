import pool from "../config/db.js";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const createPayment = async (req, res) => {
  try {
    const { order_id, amount, method } = req.body || {};
    const userId = parseInt(req.user?.id, 10);
    const orderId = parseInt(order_id, 10);
    const amt = Number(amount);

    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
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
    const tokenUserId = parseInt(req.user?.id, 10);
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

    // Enforce ownership (admin may bypass if configured)
    if (!Number.isInteger(tokenUserId) || tokenUserId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const isAdmin = await isAdminUser(tokenUserId);
    if (!isAdmin && row.user_id !== tokenUserId) {
      return res.status(403).json({ message: "Forbidden: payment belongs to another user" });
    }

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

// Helper: check admin using env-configured IDs or emails
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

export const createPaymentIntent = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    const orderId = parseInt(req.body?.order_id, 10);

    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!orderId || orderId <= 0) {
      return res.status(400).json({ message: "Invalid order_id" });
    }
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

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

    const amountCents = Math.round(Number(order.total_price) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "zar",
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: String(orderId), userId: String(userId) },
      },
      { idempotencyKey: `order-${orderId}` }
    );

    const paymentRes = await pool.query(
      `INSERT INTO payments (order_id, amount, method, transaction_id, payment_status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id, order_id, amount, method, transaction_id, payment_status, created_at`,
      [orderId, Number(order.total_price), "STRIPE", intent.id]
    );
    const payment = paymentRes.rows[0];

    return res.status(201).json({ client_secret: intent.client_secret, payment_intent_id: intent.id, payment });
  } catch (err) {
    console.error("Create PaymentIntent error:", err.message);
    return res.status(500).json({ message: "Error creating payment intent" });
  }
};

export const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!whSecret) {
      return res.status(500).send("Webhook not configured");
    }
    if (!stripe) {
      return res.status(500).send("Stripe not configured");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const txId = intent.id;
        try {
          const payRes = await pool.query(
            "SELECT order_id FROM payments WHERE transaction_id=$1",
            [txId]
          );
          if (payRes.rows.length > 0) {
            const orderId = payRes.rows[0].order_id;
            await pool.query("UPDATE payments SET payment_status='SUCCEEDED' WHERE transaction_id=$1", [txId]);
            await pool.query("UPDATE orders SET payment_status='PAID' WHERE id=$1", [orderId]);
          }
        } catch (e) {
          console.error("Webhook update failed:", e.message);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const txId = intent.id;
        try {
          await pool.query("UPDATE payments SET payment_status='FAILED' WHERE transaction_id=$1", [txId]);
        } catch (e) {
          console.error("Webhook fail update error:", e.message);
        }
        break;
      }
      default:
        break;
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    return res.status(500).send("server error");
  }
};

export const confirmPaymentIntent = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    const orderId = parseInt(req.body?.order_id, 10);
    const intentId = String(req.body?.payment_intent_id || '').trim();
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!orderId || orderId <= 0 || !intentId) {
      return res.status(400).json({ message: "Invalid order_id or payment_intent_id" });
    }
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

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

    let intent = await stripe.paymentIntents.retrieve(intentId);
    if (!intent || intent.status !== "succeeded") {
      try {
        intent = await stripe.paymentIntents.confirm(intentId, { payment_method: 'pm_card_visa' });
      } catch (e) {
        return res.status(400).json({ message: "Payment not succeeded" });
      }
    }

    const amountCents = Math.round(Number(order.total_price) * 100);
    if (Number(intent.amount_received || intent.amount) !== amountCents) {
      return res.status(400).json({ message: "Amount mismatch" });
    }
    if (intent.metadata && intent.metadata.orderId && Number(intent.metadata.orderId) !== Number(orderId)) {
      return res.status(400).json({ message: "OrderId metadata mismatch" });
    }

    await pool.query("UPDATE payments SET payment_status='SUCCEEDED' WHERE transaction_id=$1", [intentId]);
    await pool.query("UPDATE orders SET payment_status='PAID' WHERE id=$1", [orderId]);

    const payRes = await pool.query(
      `SELECT id, order_id, amount, method, transaction_id, payment_status, created_at FROM payments WHERE transaction_id=$1`,
      [intentId]
    );
    const payment = payRes.rows[0] || null;

    return res.status(200).json({ order: { id: order.id, payment_status: 'PAID', total_price: Number(order.total_price) }, payment });
  } catch (err) {
    console.error("Confirm PaymentIntent error:", err.message);
    return res.status(500).json({ message: "Error confirming payment" });
  }
};
