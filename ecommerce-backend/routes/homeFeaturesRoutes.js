import express from "express";
import { getHomeFeatures } from "../controllers/home_features/homeFeaturesController.js";

const router = express.Router();

/**
 * @swagger
 * /api/home-features:
 *   get:
 *     summary: Home page featured data
 *     description: Returns trendy product, new arrival, featured collection, top rated, and low stock alert.
 *     tags: [Home Features]
 *     responses:
 *       200:
 *         description: Featured data for home page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trendy_product:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     product_id: { type: integer }
 *                     name: { type: string }
 *                     image_url: { type: string, nullable: true }
 *                 new_arrival:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     product_id: { type: integer }
 *                     name: { type: string }
 *                     image_url: { type: string, nullable: true }
 *                 featured_collection:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     category_id: { type: integer }
 *                     category_name: { type: string }
 *                     top_product:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         product_id: { type: integer }
 *                         name: { type: string }
 *                         image_url: { type: string, nullable: true }
 *                 top_rated:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     product_id: { type: integer }
 *                     name: { type: string }
 *                     image_url: { type: string, nullable: true }
 *                 low_stock_alert:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     product_id: { type: integer }
 *                     name: { type: string }
 *                     image_url: { type: string, nullable: true }
 *       500:
 *         description: Server error
 */
router.get("/", getHomeFeatures);

export default router;
