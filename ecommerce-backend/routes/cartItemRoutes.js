import express from "express";
import { addCartItem, updateCartItem, deleteCartItem } from "../controllers/cartController.js";

const router = express.Router();

/**
 * @swagger
 * /api/cart-items:
 *   post:
 *     summary: Add an item to a user's active cart (creates cart if none)
 *     tags:
 *       - Shopping Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - product_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
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
router.post("/", addCartItem);

/**
 * @swagger
 * /api/cart-items/{id}:
 *   put:
 *     summary: Update quantity for a cart item (user-owned, ACTIVE cart only)
 *     tags:
 *       - Shopping Cart
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
 *               - user_id
 *               - quantity
 *             properties:
 *               user_id:
 *                 type: integer
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
router.put("/:id", updateCartItem);

/**
 * @swagger
 * /api/cart-items/{id}:
 *   delete:
 *     summary: Remove a cart item (user-owned, ACTIVE cart only)
 *     tags:
 *       - Shopping Cart
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
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated cart with items and totals after deletion
 *       403:
 *         description: Forbidden (cart item does not belong to user or cart not ACTIVE)
 *       404:
 *         description: Cart item not found
 */
router.delete("/:id", deleteCartItem);

export default router;