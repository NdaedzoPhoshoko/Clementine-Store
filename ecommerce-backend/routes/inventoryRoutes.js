import express from "express";
import { getInventoryLogs, adjustStock, adjustStockBatch } from "../controllers/inventoryController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/inventory-logs:
 *   get:
 *     summary: List inventory change logs
 *     description: Returns inventory change logs with optional filters and pagination.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page (max 100)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *         description: Filter by change type (e.g., "SALE" or "RESTOCK")
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source (order, return, manual, adjustment)
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filter by variant size
 *       - in: query
 *         name: colorHex
 *         schema:
 *           type: string
 *         description: Filter by variant color hex code
 *       - in: query
 *         name: actorUserId
 *         schema:
 *           type: integer
 *         description: Filter by actor user id
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range (inclusive)
 *     responses:
 *       200:
 *         description: Inventory logs with pagination metadata
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
 *                       product_id: { type: integer }
 *                       product_name: { type: string }
 *                       change_type: { type: string }
 *                       quantity_changed: { type: integer }
 *                       size: { type: string }
 *                       color_hex: { type: string }
 *                       previous_stock: { type: integer }
 *                       new_stock: { type: integer }
 *                       source: { type: string }
 *                       reason: { type: string }
 *                       note: { type: string }
 *                       actor_user_id: { type: integer }
 *                       actor_name: { type: string }
 *                       order_id: { type: integer }
 *                       cart_item_id: { type: integer }
 *                       created_at: { type: string, format: date-time }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *                     hasNext: { type: boolean }
 *                     hasPrev: { type: boolean }
 *       500:
 *         description: Server error while fetching inventory logs
 */
router.get("/", protect, requireAdmin, getInventoryLogs);

/**
 * @swagger
 * /api/inventory-logs/adjust:
 *   post:
 *     summary: Adjust product stock and create an inventory log
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id: { type: integer }
 *               quantity_changed: { type: integer, description: "Positive for restock, negative for deduction" }
 *               change_type: { type: string }
 *               size: { type: string }
 *               color_hex: { type: string }
 *               source: { type: string }
 *               reason: { type: string }
 *               note: { type: string }
 *               order_id: { type: integer }
 *               cart_item_id: { type: integer }
 *     responses:
 *       201:
 *         description: Stock adjusted and log created
 *       400:
 *         description: Invalid input or negative resulting stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privilege required
 *       500:
 *         description: Server error while adjusting stock
 */
router.post("/adjust", protect, requireAdmin, adjustStock);
/**
 * @swagger
 * /api/inventory-logs/adjust/batch:
 *   post:
 *     summary: Adjust product stock for multiple variant entries in a single transaction
 *     description: Accepts an array of adjustment items or an object with an `items` array. Each item creates an inventory log and updates product stock sequentially per product.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id: { type: integer }
 *                         quantity_changed: { type: integer, description: "Positive for restock, negative for deduction" }
 *                         change_type: { type: string }
 *                         size: { type: string }
 *                         color_hex: { type: string }
 *                         source: { type: string }
 *                         reason: { type: string }
 *                         note: { type: string }
 *                         order_id: { type: integer }
 *                         cart_item_id: { type: integer }
 *               - type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id: { type: integer }
 *                     quantity_changed: { type: integer }
 *                     change_type: { type: string }
 *                     size: { type: string }
 *                     color_hex: { type: string }
 *                     source: { type: string }
 *                     reason: { type: string }
 *                     note: { type: string }
 *                     order_id: { type: integer }
 *                     cart_item_id: { type: integer }
 *     responses:
 *       201:
 *         description: Stock adjustments applied and logs created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id: { type: integer }
 *                       final_stock: { type: integer }
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid input or negative resulting stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privilege required
 *       500:
 *         description: Server error while adjusting stock in batch
 */
router.post("/adjust/batch", protect, requireAdmin, adjustStockBatch);

export default router;
