import express from "express";
import { refreshToken, logout, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using httpOnly refresh cookie
 *     tags:
  *       - Auth
  *     responses:
  *       200:
  *         description: New access token issued
  */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and revoke refresh tokens
 *     tags:
  *       - Auth
  *     responses:
  *       200:
  *         description: Logged out and cookie cleared
  */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Initiate password reset by sending OTP to email
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
 *     responses:
 *       200:
 *         description: OTP generated and returned for frontend email delivery
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP generated
 *                 passcode:
 *                   type: string
 *                   description: 6-digit OTP
 *                   example: "123456"
 *                 time:
 *                   type: string
 *                   description: Human-readable expiry timestamp (now + 10 minutes)
 *                   example: "2025/10/14, 12:34:56 PM"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: ISO expiry timestamp
 *                   example: "2025-10-14T10:34:56.000Z"
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using email OTP
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
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password by confirming old password
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post("/change-password", protect, changePassword);

export default router;