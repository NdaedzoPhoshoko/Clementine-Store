import express from "express";
import { getUsers, registerUser, loginUser, getMe, getUserById, updateUserById, updateMe, createAdmin } from "../controllers/userController.js";
import { protect, requireSelfOrAdmin, requireAdmin } from "../middleware/auth.js";
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users (optionally only admins)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: onlyAdmins
 *         schema:
 *           type: boolean
 *         description: If true, return only admin users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *         description: Page size (default 20, max 200)
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *                       name: { type: string }
 *                       email: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       isAdmin: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin privilege required
 */
router.get("/", protect, requireAdmin, getUsers);

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created and token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     isAdmin: { type: boolean }
 *                 token: { type: string }
 *                 accessToken: { type: string }
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in and token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     isAdmin: { type: boolean }
 *                 token: { type: string }
 *                 accessToken: { type: string }
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 created_at: { type: string, format: date-time }
 *                 isAdmin: { type: boolean }
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags:
 *       - User Profile & Setting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the user
 *               email:
 *                 type: string
 *                 description: New email for the user (must be unique)
 *     responses:
 *       200:
 *         description: Current user's profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 created_at: { type: string, format: date-time }
 *       400:
 *         description: No fields provided or invalid data
 *       409:
 *         description: Email already in use by another user
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error while updating profile
 */
router.put("/me", protect, updateMe);

// Removed GET /admins in favor of query on GET /api/users

/**
 * @swagger
 * /api/users/admins:
 *   post:
 *     summary: Create a new admin user
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
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Admin user created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 created_at: { type: string, format: date-time }
 *                 isAdmin: { type: boolean }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin privilege required
 */
router.post("/admins", protect, requireAdmin, createAdmin);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags:
 *       - User Profile & Setting
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid user id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error while fetching user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/:id", protect, requireSelfOrAdmin, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile by ID
 *     tags:
 *       - User Profile & Setting
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the user
 *               email:
 *                 type: string
 *                 description: New email for the user (must be unique)
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid user id or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       409:
 *         description: Email already in use by another user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error while updating user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.put("/:id", protect, requireSelfOrAdmin, updateUserById);

export default router;
