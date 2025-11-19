import express from "express";
import { createOrder, getUserOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Checkouts & Orders
 *     description: Checkout flow and order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from the user's ACTIVE cart
 *     description: Copies items from the user's ACTIVE cart into an order with PENDING payment status, optionally captures shipping details, and marks the cart as CHECKOUT_IN_PROGRESS.
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
 *               shipping:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "Jane Doe" }
 *                   address: { type: string, example: "123 Rose St" }
 *                   city: { type: string, example: "Cape Town" }
 *                   province: { type: string, example: "Western Cape" }
 *                   postal_code: { type: string, example: "8001" }
 *                   phone_number: { type: string, example: "+27 82 000 1111" }
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     user_id: { type: integer }
 *                     total_price: { type: number }
 *                     payment_status: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_item_id: { type: integer }
 *                       product_id: { type: integer }
 *                       quantity: { type: integer }
 *                       price: { type: number }
 *                       name: { type: string }
 *                       image_url: { type: string }
 *                 shipping:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     address: { type: string }
 *                     city: { type: string }
 *                     province: { type: string }
 *                     postal_code: { type: string }
 *                     phone_number: { type: string }
 *                     delivery_status: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     itemsCount: { type: integer }
 *                     total: { type: number }
 *       400:
 *         description: Invalid input or empty cart
 *       500:
 *         description: Server error while creating order
*/
router.post("/", protect, createOrder);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get orders for the signed-in user
 *     description: Returns a paginated list of the user's orders including items and shipping details.
 *     tags: [Checkouts & Orders]
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
 *     responses:
 *       200:
 *         description: Orders fetched successfully
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
 *                       user_id: { type: integer }
 *                       total_price: { type: number }
 *                       payment_status: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             order_item_id: { type: integer }
 *                             product_id: { type: integer }
 *                             quantity: { type: integer }
 *                             price: { type: number }
 *                             name: { type: string }
 *                             image_url: { type: string }
 *                       shipping:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           address: { type: string }
 *                           city: { type: string }
 *                           province: { type: string }
 *                           postal_code: { type: string }
 *                           phone_number: { type: string }
 *                           delivery_status: { type: string }
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
 *         description: Server error while fetching orders
 */
router.get("/my", protect, getUserOrders);

export default router;