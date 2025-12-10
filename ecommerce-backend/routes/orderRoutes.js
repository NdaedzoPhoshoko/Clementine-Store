import express from "express";
import { createOrder, patchPendingOrder, getUserOrders, updateOrderShipping, getTrackOrder } from "../controllers/orderController.js";
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
 *                       size: { type: string }
 *                       color_hex: { type: string }
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
 * /api/orders:
 *   patch:
 *     summary: Patch the user's latest PENDING order to continue checkout
 *     description: Reuses the most recent PENDING order instead of creating a new one. Optionally updates shipping details and marks the cart as CHECKOUT_IN_PROGRESS.
 *     tags: [Checkouts & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   address: { type: string }
 *                   city: { type: string }
 *                   province: { type: string }
 *                   postal_code: { type: string }
 *                   phone_number: { type: string }
 *     responses:
 *       200:
 *         description: Pending order patched and returned
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
 *                       size: { type: string }
 *                       color_hex: { type: string }
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
 *       401:
 *         description: Not authorized
 *       404:
 *         description: No pending order found
 *       500:
 *         description: Server error while patching order
 */
router.patch("/", protect, patchPendingOrder);

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
 *                             size: { type: string }
 *                             color_hex: { type: string }
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

/**
 * @swagger
 * /api/orders/{id}/shipping:
 *   patch:
 *     summary: Update shipping information for an order
 *     description: Partially update name, address, city, province, postal_code, phone_number, or delivery_status for the user's order.
 *     tags: [Checkouts & Orders]
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
 *               name: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               province: { type: string }
 *               postal_code: { type: string }
 *               phone_number: { type: string }
 *               delivery_status: { type: string }
 *     responses:
 *       200:
 *         description: Shipping updated
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
 *                 shipping:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     address: { type: string }
 *                     city: { type: string }
 *                     province: { type: string }
 *                     postal_code: { type: string }
 *                     phone_number: { type: string }
 *                     delivery_status: { type: string }
 *       400:
 *         description: Invalid input or no fields to update
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error while updating shipping
 */
router.patch("/:id/shipping", protect, updateOrderShipping);

/**
 * @swagger
 * /api/orders/track/{id}:
 *   get:
 *     summary: Track order status
 *     description: Get the current status of an order by its ID without authentication.
 *     tags: [Checkouts & Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order status found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 status: { type: string, description: "Delivery status e.g. Pending, Shipped, Delivering, Delivered" }
 *                 payment_status: { type: string }
 *                 created_at: { type: string, format: date-time }
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get("/track/:id", getTrackOrder);

export default router;
