import express from "express";
import { getUserCart, clearUserCart } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the active cart for a user
 *     tags:
 *       - Shopping Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active cart with items and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cart_item_id:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                       added_at:
 *                         type: string
 *                         format: date-time
 *                       product_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       image_url:
 *                         type: string
 *                       stock:
 *                         type: integer
 *                       category_id:
 *                         type: integer
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     subtotal:
 *                       type: number
 */
router.get("/", protect, getUserCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear all items from the user's active cart
 *     tags:
 *       - Shopping Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 items:
 *                   type: array
 *                   items: {}
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       example: 0
 *                     subtotal:
 *                       type: number
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Cart cleared successfully"
 *       401:
 *         description: Not authorized
 *       404:
 *         description: No active cart found
 *       500:
 *         description: Server error while clearing cart
 */
router.delete("/", protect, clearUserCart);

export default router;