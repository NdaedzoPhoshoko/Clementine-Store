import express from "express";
import { createPayment, getPaymentByTransactionId, createPaymentIntent, stripeWebhook, confirmPaymentIntent } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment record for an order (stubbed)
 *     description: Validates the order belongs to the user and that the amount equals the order total, then creates a PENDING payment. Integrate a payment gateway later to mark it PAID via webhook.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, amount, method]
 *             properties:
 *               order_id: { type: integer, example: 42 }
 *               amount: { type: number, example: 499.99 }
 *               method: { type: string, example: "CARD" }
 *     responses:
 *       201:
 *         description: Payment created in PENDING status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     order_id: { type: integer }
 *                     amount: { type: number }
 *                     method: { type: string }
 *                     transaction_id: { type: string }
 *                     payment_status: { type: string, example: "PENDING" }
 *                     created_at: { type: string, format: date-time }
 *       400:
 *         description: Invalid input or order already paid
 *       403:
 *         description: Forbidden - order belongs to another user
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while creating payment
 */
router.post("/", protect, createPayment);

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create Stripe PaymentIntent for an order
 *     description: Validates the order and returns client_secret for Stripe payment confirmation.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id: { type: integer, example: 42 }
 *     responses:
 *       201:
 *         description: PaymentIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client_secret: { type: string }
 *                 payment_intent_id: { type: string }
 *       400:
 *         description: Invalid input or order state
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error or Stripe not configured
 */
router.post("/create-intent", protect, createPaymentIntent);

// Webhook: must use raw body; middleware is configured in server.js
router.post("/webhook", stripeWebhook);

router.post("/confirm-intent", protect, confirmPaymentIntent);

/**
 * @swagger
 * /api/payments/{transaction_id}:
 *   get:
 *     summary: Get a payment by transaction_id
 *     description: Returns the payment record and related order summary for the given transaction_id.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "TEST-1712345678901-ab12cd"
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     order_id: { type: integer }
 *                     amount: { type: number }
 *                     method: { type: string }
 *                     transaction_id: { type: string }
 *                     payment_status: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                 order:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     user_id: { type: integer }
 *                     total_price: { type: number }
 *                     payment_status: { type: string }
 *       400:
 *         description: Invalid transaction_id
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error while fetching payment
 */
router.get("/:transaction_id", protect, getPaymentByTransactionId);

export default router;
