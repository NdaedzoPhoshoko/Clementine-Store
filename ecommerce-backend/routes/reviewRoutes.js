import express from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a product
 *     description: Creates a review with rating (1-5) and optional comment for a product. Enforces one review per user per product.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - rating
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 100
 *               rating:
 *                 type: integer
 *                 description: Integer between 1 and 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Great quality and fast delivery!"
 *     responses:
 *       201:
 *         description: Review created with updated stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     user_id: { type: integer }
 *                     product_id: { type: integer }
 *                     rating: { type: integer }
 *                     comment: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                 stats:
 *                   type: object
 *                   properties:
 *                     averageRating: { type: number }
 *                     reviewCount: { type: integer }
 *       400:
 *         description: Invalid input (product_id or rating)
 *       404:
 *         description: User or product not found
 *       409:
 *         description: Review already exists for this user and product
 *       500:
 *         description: Server error while creating review
 */
router.post("/", protect, createReview);

export default router;
