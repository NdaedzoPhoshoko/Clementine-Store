import express from "express";
import { protect } from "../middleware/auth.js";
import { savePaymentCard, removePaymentCard } from "../controllers/paymentCardController.js";

const router = express.Router();

/**
 * @swagger
 * /api/cards:
 *   post:
 *     summary: Save a payment card (metadata only)
 *     description: Stores brand, last4, expiry, cardholder name, and optional external token for reuse. Does not store full PAN or CVV.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand: { type: string, example: "visa" }
 *               card_number: { type: string, example: "4111 1111 1111 1111" }
 *               last4: { type: string, example: "1111" }
 *               exp: { type: string, example: "12/2027" }
 *               exp_month: { type: integer, example: 12 }
 *               exp_year: { type: integer, example: 2027 }
 *               cardholder_name: { type: string, example: "Jane Doe" }
 *               external_token: { type: string, example: "pm_123..." }
 *     responses:
 *       201:
 *         description: Saved card metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 card:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     user_id: { type: integer }
 *                     brand: { type: string }
 *                     last4: { type: string }
 *                     exp_month: { type: integer }
 *                     exp_year: { type: integer }
 *                     cardholder_name: { type: string }
 *                     external_token: { type: string }
 *                     created_at: { type: string, format: date-time }
 *       400: { description: Invalid input }
 *       401: { description: Not authorized }
 *       500: { description: Server error }
 */
router.post("/", protect, savePaymentCard);

/**
 * @swagger
 * /api/cards/{id}:
 *   delete:
 *     summary: Remove a saved payment card
 *     description: Deletes the saved card if it belongs to the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Removed }
 *       401: { description: Not authorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *       500: { description: Server error }
 */
router.delete("/:id", protect, removePaymentCard);

export default router;

