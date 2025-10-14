import express from "express";
import { getInventoryLogs } from "../controllers/inventoryController.js";

const router = express.Router();

/**
 * @swagger
 * /api/inventory-logs:
 *   get:
 *     summary: List inventory change logs
 *     description: Returns inventory change logs with optional filters and pagination.
 *     tags:
 *       - Admin
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
router.get("/", getInventoryLogs);

export default router;