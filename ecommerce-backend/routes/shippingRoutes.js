import express from "express";
import { createOrUpdateShippingDetails, getShippingDetails, getMyShippingDetails, getShippingReuseOptions } from "../controllers/shippingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/shipping-details:
 *   post:
 *     summary: Create or update shipping details for an order
 *     description: Validates the order belongs to the user, then inserts or updates shipping details.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, name, address, city]
 *             properties:
 *               order_id: { type: integer, example: 42 }
 *               name: { type: string, example: "Jane Doe" }
 *               address: { type: string, example: "123 Rose St" }
 *               city: { type: string, example: "Cape Town" }
 *               province: { type: string, example: "Western Cape" }
 *               postal_code: { type: string, example: "8001" }
 *               phone_number: { type: string, example: "+27 82 000 1111" }
 *     responses:
 *       201:
 *         description: Shipping details saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shipping:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     order_id: { type: integer }
 *                     user_id: { type: integer }
 *                     name: { type: string }
 *                     address: { type: string }
 *                     city: { type: string }
 *                     province: { type: string }
 *                     postal_code: { type: string }
 *                     phone_number: { type: string }
 *                     delivery_status: { type: string }
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - order belongs to another user
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while saving shipping details
 */
router.post("/", protect, createOrUpdateShippingDetails);

/**
 * @swagger
 * /api/shipping-details:
 *   get:
 *     summary: Get shipping details
 *     description: If `order_id` is provided, returns a single shipping detail for that order. If only `user_id` is provided, returns a paginated list of that user's shipping details.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_id
 *         schema:
 *           type: integer
 *         description: Order ID to fetch shipping details for
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: User ID to list all shipping details for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number when listing by user_id
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page when listing by user_id
 *     responses:
 *       200:
 *         description: Shipping detail or list of shipping details
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     shipping:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         order_id: { type: integer }
 *                         user_id: { type: integer }
 *                         name: { type: string }
 *                         address: { type: string }
 *                         city: { type: string }
 *                         province: { type: string }
 *                         postal_code: { type: string }
 *                         phone_number: { type: string }
 *                         delivery_status: { type: string }
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           order_id: { type: integer }
 *                           user_id: { type: integer }
 *                           name: { type: string }
 *                           address: { type: string }
 *                           city: { type: string }
 *                           province: { type: string }
 *                           postal_code: { type: string }
 *                           phone_number: { type: string }
 *                           delivery_status: { type: string }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         pages: { type: integer }
 *                         hasNext: { type: boolean }
 *                         hasPrev: { type: boolean }
 *       400:
 *         description: Missing filters
 *       403:
 *         description: Forbidden - order belongs to another user
 *       404:
 *         description: Shipping details not found
 *       500:
 *         description: Server error while fetching shipping details
 */
router.get("/", protect, getShippingDetails);

/**
 * @swagger
 * /api/shipping-details/my:
 *   get:
 *     summary: Get shipping details for the signed-in user
 *     description: Returns a paginated list of shipping details that belong to the authenticated user.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of shipping details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       order_id: { type: integer }
 *                       user_id: { type: integer }
 *                       name: { type: string }
 *                       address: { type: string }
 *                       city: { type: string }
 *                       province: { type: string }
 *                       postal_code: { type: string }
 *                       phone_number: { type: string }
 *                       delivery_status: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *                     hasNext: { type: boolean }
 *                     hasPrev: { type: boolean }
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error while fetching shipping details
 */
router.get("/my", protect, getMyShippingDetails);

/**
 * @swagger
 * /api/shipping-details/reuse:
 *   get:
 *     summary: Get distinct shipping locations for reuse
 *     description: Returns unique combinations of city, province, and postal_code used by the authenticated user, for quick reuse in checkout.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of distinct shipping info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       city:
 *                         type: string
 *                         nullable: true
 *                       province:
 *                         type: string
 *                         nullable: true
 *                       postal_code:
 *                         type: string
 *                         nullable: true
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error while fetching reuse options
 */
router.get("/reuse", protect, getShippingReuseOptions);

export default router;
