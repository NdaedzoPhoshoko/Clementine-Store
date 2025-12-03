import express from "express";
import { getUserCart, clearUserCart, revertCheckoutCart } from "../controllers/cartController.js";
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
  *                       size:
  *                         type: string
  *                       color_hex:
  *                         type: string
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

/**
 * @swagger
 * /api/cart/revert-checkout:
 *   post:
 *     summary: Revert checkout in progress and restore the active cart
 *     description: Flips the user's CHECKOUT_IN_PROGRESS cart back to ACTIVE and returns the cart, items, and totals.
 *     tags:
 *       - Shopping Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout cancelled and cart restored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *                   nullable: true
 *                 items:
 *                   type: array
 *                   items: {}
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     subtotal:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: "Checkout cancelled"
 *       401:
 *         description: Not authorized
 *       404:
 *         description: No cart in checkout in progress
 *       500:
 *         description: Server error while reverting checkout
 */
router.post("/revert-checkout", protect, revertCheckoutCart);

export default router;
