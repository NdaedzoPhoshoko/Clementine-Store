import pool from "../config/db.js";

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};
