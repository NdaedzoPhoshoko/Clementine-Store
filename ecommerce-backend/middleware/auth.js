import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// Admin check based on env configuration without changing DB schema
// Supports either ADMIN_USER_IDS (comma-separated ids) and/or ADMIN_EMAILS (comma-separated emails)
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const ids = String(process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (ids.includes(Number(userId))) return next();

    const emails = String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);

    if (emails.length > 0) {
      const result = await pool.query("SELECT email FROM users WHERE id=$1", [userId]);
      const email = result.rows[0]?.email;
      if (email && emails.includes(email)) return next();
    }

    return res.status(403).json({ message: "Admin privilege required" });
  } catch (err) {
    console.error("Admin check failed:", err.message);
    return res.status(500).json({ message: "Error verifying admin" });
  }
};

// Ensure the requested user id matches the token user or admin
export const requireSelfOrAdmin = async (req, res, next) => {
  try {
    const tokenUserId = req.user?.id;
    const paramId = parseInt(req.params.id, 10);
    if (!tokenUserId) return res.status(401).json({ message: "Not authorized" });
    if (Number(tokenUserId) === Number(paramId)) return next();

    // Fallback to admin
    return requireAdmin(req, res, next);
  } catch (err) {
    console.error("Self-or-admin check failed:", err.message);
    return res.status(500).json({ message: "Error verifying permissions" });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
    }
  } catch (_) {}
  next();
};
