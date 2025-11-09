import express from "express";
import { addCartItem, updateCartItem, deleteCartItem } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/cart-items:
 *   post:
 *     summary: Add an item to a user's active cart (creates cart if none)
 *     tags:
 *       - Shopping Cart
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
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
  *               size:
  *                 type: string
  *                 description: Selected size for variant products
  *               color_hex:
  *                 type: string
  *                 description: Selected color hex code (e.g., #001F3F)
 *     responses:
 *       201:
 *         description: Updated cart with items and totals
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
 *       400:
 *         description: Invalid input or insufficient stock
 */
router.post("/", protect, addCartItem);

/**
 * @swagger
 * /api/cart-items/{id}:
 *   put:
 *     summary: Update quantity for a cart item (user-owned, ACTIVE cart only)
 *     tags:
 *       - Shopping Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated cart with items and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *                 items:
 *                   type: array
 *                 meta:
 *                   type: object
 *       400:
 *         description: Invalid input or insufficient stock
 *       403:
 *         description: Forbidden (cart item does not belong to user or non-active cart)
 *       404:
 *         description: Cart item not found
 */
router.put("/:id", protect, updateCartItem);

/**
 * @swagger
 * /api/cart-items/{id}:
 *   delete:
 *     summary: Remove a cart item (user-owned, ACTIVE cart only)
 *     tags:
 *       - Shopping Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Updated cart with items and totals after deletion
 *       403:
 *         description: Forbidden (cart item does not belong to user or cart not ACTIVE)
 *       404:
 *         description: Cart item not found
 */
router.delete("/:id", protect, deleteCartItem);

export default router;