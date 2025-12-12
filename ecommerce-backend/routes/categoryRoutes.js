import express from "express";
import {
  listCategories,
  getCategoryById,
  getCategoryProducts,
  addCategoriesBulk,
  updateCategory,
  deleteCategory,
  listCategoriesWithImages,
  getCategorySalesSummary,
} from "../controllers/categoryController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List categories
 *     tags:
 *       - Products & Categories
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get("/", listCategories);

/**
 * @swagger
 * /api/categories/with-images:
 *   get:
 *     summary: List categories with an image (last image in the category)
 *     tags:
 *       - Products & Categories
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of categories with image
 */
router.get("/with-images", listCategoriesWithImages);

/**
 * @swagger
 * /api/categories/sales:
 *   get:
 *     summary: Category sales summary
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [last_month, last_2_months, last_3_months, prev_quarter, all_time]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO timestamp; overrides period when provided
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO timestamp; overrides period when provided
 *       - in: query
 *         name: paidOnly
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Sales per category ordered by items sold desc
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
 *                       category_id: { type: integer }
 *                       category_name: { type: string }
 *                       items_sold: { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *                     startDate: { type: string, format: date-time }
 *                     endDate: { type: string, format: date-time }
 *                     period: { type: string }
 */
router.get("/sales", protect, requireAdmin, getCategorySalesSummary);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a specific category
 *     tags:
 *       - Products & Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories/{ids}/products:
 *   get:
 *     summary: Get products for given categories
 *     tags:
 *       - Products & Categories
 *     parameters:
 *       - in: path
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *           example: "1,2,3"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get("/:ids/products", getCategoryProducts);

/**
 * @swagger
 * /api/categories/add:
 *   post:
 *     summary: Add multiple categories (admin only)
 *     tags:
 *       - Products & Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Categories added
 */
router.post("/add", protect, requireAdmin, addCategoriesBulk);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags:
 *       - Products & Categories
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put("/:id", protect, requireAdmin, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags:
 *       - Products & Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete("/:id", protect, requireAdmin, deleteCategory);

export default router;
