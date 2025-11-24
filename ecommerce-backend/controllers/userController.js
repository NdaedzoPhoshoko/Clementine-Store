import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { setLoginCookiesAndTokens } from "./authController.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insert = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, passwordHash]
    );

    const user = insert.rows[0];
    const { accessToken, refreshToken } = setLoginCookiesAndTokens(res, user.id, 0);
    res.status(201).json({ user, token: accessToken, accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash, created_at, token_version FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // omit password_hash
    const { password_hash, ...safeUser } = user;
    const { accessToken } = setLoginCookiesAndTokens(res, user.id, user.token_version || 0);
    res.status(200).json({ user: safeUser, token: accessToken, accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id=$1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id=$1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id=$1",
      [userId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const existing = existingRes.rows[0];

    const { name, email } = req.body || {};

    if (typeof name === "undefined" && typeof email === "undefined") {
      return res.status(400).json({ message: "No fields to update" });
    }

    if (typeof name !== "undefined") {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      existing.name = trimmedName;
    }

    if (typeof email !== "undefined") {
      const trimmedEmail = String(email).trim();
      if (!trimmedEmail) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      // Ensure email is unique (not used by other users)
      const conflict = await pool.query(
        "SELECT id FROM users WHERE email=$1 AND id<>$2",
        [trimmedEmail, userId]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
      existing.email = trimmedEmail;
    }

    const updateRes = await pool.query(
      "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email, created_at",
      [existing.name, existing.email, userId]
    );

    return res.status(200).json(updateRes.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const tokenUserId = parseInt(req.user?.id, 10);
    if (!tokenUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id=$1",
      [tokenUserId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const existing = existingRes.rows[0];

    const { name, email } = req.body || {};

    if (typeof name === "undefined" && typeof email === "undefined") {
      return res.status(400).json({ message: "No fields to update" });
    }

    if (typeof name !== "undefined") {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      existing.name = trimmedName;
    }

    if (typeof email !== "undefined") {
      const trimmedEmail = String(email).trim();
      if (!trimmedEmail) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      const conflict = await pool.query(
        "SELECT id FROM users WHERE email=$1 AND id<>$2",
        [trimmedEmail, tokenUserId]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
      existing.email = trimmedEmail;
    }

    const updateRes = await pool.query(
      "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email, created_at",
      [existing.name, existing.email, tokenUserId]
    );

    return res.status(200).json(updateRes.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile" });
  }
};
