import express from "express";
import multer from "multer";
import { listProducts, getProductById, getProductReviews, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage, deleteAllProductImages, getLatestProducts, autocompleteProductNames } from "../controllers/productController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products with filters and pagination
 *     tags:
 *       - Products & Categories
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
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or description (ILIKE)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category id
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: If true, only products with stock > 0
 *     responses:
 *       200:
 *         description: List of products with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image_url:
 *                             type: string
 *                           stock:
 *                             type: integer
 *                           category_id:
 *                             type: integer
 *                           details:
 *                             type: object
 *                             nullable: true
 *                           dimensions:
 *                             type: object
 *                             nullable: true
 *                           care_notes:
 *                             type: object
 *                             nullable: true
 *                           sustainability_notes:
 *                             type: object
 *                             nullable: true
 *                           color_variants:
 *                             type: object
 *                             nullable: true
 *                             description: JSON object or array describing color variants (e.g., name/hex/image/stock)
 *                       - type: object
 *                         properties:
 *                           average_rating:
 *                             type: number
 *                             format: float
 *                             description: Average rating score from reviews (0-5)
 *                           review_count:
 *                             type: integer
 *                             description: Number of reviews for this product
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.get("/", listProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products & Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               stock:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *               details:
 *                 type: string
 *                 nullable: true
 *                 description: JSON string for additional product details (object or array)
 *                 example: "{\"material\": \"cotton\", \"features\": [\"breathable\", \"durable\"]}"
 *               dimensions:
 *                 type: string
 *                 nullable: true
 *                 description: JSON string for product dimensions (object or array)
 *                 example: "{\"length\": \"10cm\", \"width\": \"5cm\", \"height\": \"2cm\"}"
 *               care_notes:
 *                 type: string
 *                 nullable: true
 *                 description: JSON string for care instructions (array or object)
 *                 example: "[\"Machine wash cold\", \"Tumble dry low\", \"Do not bleach\"]"
 *               sustainability_notes:
 *                 type: string
 *                 nullable: true
 *                 description: JSON string for sustainability information (object or array)
 *                 example: "{\"eco_friendly\": true, \"certifications\": [\"GOTS\", \"Fair Trade\"]}"
 *               color_variants:
 *                 type: string
 *                 nullable: true
 *                 description: JSON string for color variants (object or array)
 *                 example: "[{\"name\":\"Navy\",\"hex\":\"#001F3F\"},{\"name\":\"Sand\",\"hex\":\"#C2B280\"}]"
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     image_url:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                     category_id:
 *                       type: integer
 *                     details:
 *                       type: object
 *                       nullable: true
 *                     dimensions:
 *                       type: object
 *                       nullable: true
 *                     care_notes:
 *                       type: object
 *                       nullable: true
 *                     sustainability_notes:
 *                       type: object
 *                       nullable: true
 *                     color_variants:
 *                       type: object
 *                       nullable: true
 *       400:
 *         description: Invalid input (name, price, stock) or missing image
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error while creating product
 */
router.post("/", protect, requireAdmin, upload.single("image"), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product
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
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               image_url: { type: string }
 *               stock: { type: integer }
 *               category_id: { type: integer, nullable: true }
 *               details: { type: object, nullable: true, description: "Additional product details as JSON object or array" }
 *               dimensions: { type: object, nullable: true, description: "Product dimensions as JSON object or array" }
 *               care_notes: { type: object, nullable: true, description: "Care instructions as JSON object or array" }
 *               sustainability_notes: { type: object, nullable: true, description: "Sustainability information as JSON object or array" }
 *               color_variants: { type: object, nullable: true, description: "Color variants as JSON object or array" }
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     description: { type: string }
 *                     price: { type: number }
 *                     image_url: { type: string }
 *                     stock: { type: integer }
 *                     category_id: { type: integer, nullable: true }
 *                     details: { type: object, nullable: true }
 *                     dimensions: { type: object, nullable: true }
 *                     care_notes: { type: object, nullable: true }
 *                     sustainability_notes: { type: object, nullable: true }
 *                     color_variants: { type: object, nullable: true }
 *       400:
 *         description: Invalid input (id, name, price, or stock)
 *       404:
 *         description: Product or category not found
 *       500:
 *         description: Server error while updating product
 */
router.put("/:id", protect, requireAdmin, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Product deleted" }
 *                 product:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     description: { type: string }
 *                     price: { type: number }
 *                     image_url: { type: string }
 *                     stock: { type: integer }
 *                     category_id: { type: integer, nullable: true }
 *       400:
 *         description: Invalid product id
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error while deleting product
 */
router.delete("/:id", protect, requireAdmin, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/images:
 *   post:
 *     summary: Upload product image to Cloudinary (admin only)
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
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
  *             type: object
  *             properties:
  *               image:
  *                 type: string
  *                 format: binary
  *                 description: Upload a single file (you can also use 'images')
  *               images:
  *                 type: array
  *                 items:
  *                   type: string
  *                   format: binary
  *                 description: Upload multiple files under 'images'
 *     responses:
 *       201:
 *         description: Image uploaded and linked to product
 *         content:
 *           application/json:
 *             schema:
  *               type: object
  *               properties:
  *                 images:
  *                   type: array
  *                   items:
  *                     type: object
  *                     properties:
  *                       url: { type: string }
  *                       public_id: { type: string }
  *                 productId: { type: integer }
  *                 updatedPrimary: { type: boolean }
 *       400:
 *         description: Invalid product id or no image file
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error while uploading image
 */
router.post(
  "/:id/images",
  protect,
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  uploadProductImage
);

/**
 * @swagger
 * /api/products/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete a product image (admin only)
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
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product image ID (from product_images table)
 *     responses:
 *       200:
 *         description: Image deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Image deleted" }
 *                 deletedImageId: { type: integer }
 *                 productId: { type: integer }
 *                 updatedPrimary: { type: boolean }
 *                 newPrimaryUrl: { type: string, nullable: true }
 *       400:
 *         description: Invalid product or image id
 *       404:
 *         description: Product or image not found
 *       500:
 *         description: Server error while deleting image
 */
router.delete("/:id/images/:imageId", protect, requireAdmin, deleteProductImage);

/**
 * @swagger
 * /api/products/{id}/images:
 *   delete:
 *     summary: Delete all images for a product (admin only)
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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: All images deleted and primary cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "All product images deleted" }
 *                 productId: { type: integer }
 *                 deletedCount: { type: integer }
 *                 cloudinaryDeleteAttempted: { type: integer }
 *                 cloudinaryDeleted: { type: integer }
 *                 updatedPrimary: { type: boolean }
 *       400:
 *         description: Invalid product id
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error while deleting images
 */
router.delete("/:id/images", protect, requireAdmin, deleteAllProductImages);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details including category, images, and reviews
 *     tags:
 *       - Products & Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     image_url:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                     details:
 *                       type: object
 *                       nullable: true
 *                     dimensions:
 *                       type: object
 *                       nullable: true
 *                     care_notes:
 *                       type: object
 *                       nullable: true
 *                     sustainability_notes:
 *                       type: object
 *                       nullable: true
 *                     color_variants:
 *                       type: object
 *                       nullable: true
 *                 category:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       comment:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 reviewStats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     reviewCount:
 *                       type: integer
 */
router.get("/autocomplete", autocompleteProductNames);
router.get("/new", getLatestProducts);
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Reviews list with aggregate stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       comment:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 reviewStats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     reviewCount:
 *                       type: integer
 *       400:
 *         description: Invalid product id
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get("/:id/reviews", getProductReviews);

/**
 * @swagger
 * /api/products/new:
 *   get:
 *     summary: Get the latest 20 products
 *     tags:
 *       - Products & Categories
 *     responses:
 *       200:
 *         description: Latest products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   image_url: { type: string }
 *                   name: { type: string }
 *                   description: { type: string }
 *                   price: { type: number }
 */
/**
 * @swagger
 * /api/products/autocomplete:
 *   get:
 *     summary: Autocomplete product names by prefix
 *     tags:
 *       - Products & Categories
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Query prefix to match product names, descriptions, or category names
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Max suggestions to return (up to 50)
 *     responses:
 *       200:
 *         description: Names suggestions; total counts distinct matching product names across name, description, and category name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 names:
 *                   type: array
 *                   items:
 *                     type: string
 *                 total:
 *                   type: integer
 */
export default router;