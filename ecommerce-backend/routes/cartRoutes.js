import express from "express";
import { getUserCart } from "../controllers/cartController.js";

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the active cart for a user
 *     tags:
 *       - Shopping Cart
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose active cart to retrieve
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
router.get("/", getUserCart);

export default router;