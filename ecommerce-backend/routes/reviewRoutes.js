import express from "express";
import { createReview, getReviews, getAllReviews, updateReview, deleteReview } from "../controllers/reviewController.js";
import { protect, optionalAuth, requireAdmin } from "../middleware/auth.js";

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
router.get("/admin/all", protect, requireAdmin, getAllReviews);

/**
 * @swagger
 * /api/reviews/admin/all:
 *   get:
 *     summary: Get all reviews (Admin only)
 *     description: Retrieve all reviews with pagination, filtering, and sorting.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, user name, or email
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *         description: Filter by exact rating (1-5)
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, rating, product_name, user_name]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of reviews
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin privilege required
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review (Admin only)
 *     description: Update rating or comment of a review by ID.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       404:
 *         description: Review not found
 *       403:
 *         description: Admin privilege required
 */
router.put("/:id", protect, requireAdmin, updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (Admin only)
 *     description: Delete a review by ID.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 *       404:
 *         description: Review not found
 *       403:
 *         description: Admin privilege required
 */
router.delete("/:id", protect, requireAdmin, deleteReview);

router.post("/", protect, createReview);

export default router;
