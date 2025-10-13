import express from "express";
import { getUsers } from "../controllers/userController.js";
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Successfully fetched users
 */
router.get("/", getUsers);

export default router;
