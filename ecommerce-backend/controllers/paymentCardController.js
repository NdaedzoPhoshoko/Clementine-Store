import pool from "../config/db.js";

export const savePaymentCard = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const {
      brand,
      card_number,
      last4: last4Input,
      exp_month,
      exp_year,
      exp, // optional "MM/YYYY"
      cardholder_name,
      external_token,
    } = req.body || {};

    const b = String(brand || "").trim().toLowerCase();
    if (!b) return res.status(400).json({ message: "brand is required" });

    let digits = "";
    if (typeof card_number === "string") {
      digits = card_number.replace(/\D/g, "").slice(0, 19);
    }
    let last4 = typeof last4Input === "string" ? last4Input.replace(/\D/g, "").slice(-4) : "";
    if (!last4 && digits) last4 = digits.slice(-4);
    if (!last4 || last4.length !== 4) return res.status(400).json({ message: "last4 is required or derive from card_number" });

    let mm = Number(exp_month);
    let yy = Number(exp_year);
    if ((!mm || !yy) && typeof exp === "string") {
      const m = exp.trim().match(/^(\d{2})\/(\d{4})$/);
      if (m) {
        mm = Number(m[1]);
        yy = Number(m[2]);
      }
    }
    if (!Number.isInteger(mm) || mm < 1 || mm > 12) return res.status(400).json({ message: "Invalid exp_month" });
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(yy) || yy < currentYear) return res.status(400).json({ message: "Invalid exp_year" });

    const name = String(cardholder_name || "").trim();
    if (!name) return res.status(400).json({ message: "cardholder_name is required" });

    const token = typeof external_token === "string" ? external_token.trim() : null;

    const insertSql = `
      INSERT INTO saved_payment_cards (user_id, brand, last4, exp_month, exp_year, cardholder_name, external_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ON CONSTRAINT saved_payment_cards_user_last4_exp_unique DO UPDATE
        SET external_token = EXCLUDED.external_token
      RETURNING id, user_id, brand, last4, exp_month, exp_year, cardholder_name, external_token, created_at
    `;
    const result = await pool.query(insertSql, [userId, b, last4, mm, yy, name, token]);
    const card = result.rows[0];
    return res.status(201).json({ card });
  } catch (err) {
    console.error("Save payment card error:", err.message);
    return res.status(500).json({ message: "Error saving payment card" });
  }
};

export const removePaymentCard = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId) return res.status(401).json({ message: "Not authorized" });
    const id = parseInt(req.params?.id, 10);
    if (!id || id <= 0) return res.status(400).json({ message: "Invalid card id" });

    const found = await pool.query("SELECT id, user_id FROM saved_payment_cards WHERE id=$1", [id]);
    if (found.rows.length === 0) return res.status(404).json({ message: "Saved card not found" });
    if (found.rows[0].user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    await pool.query("DELETE FROM saved_payment_cards WHERE id=$1", [id]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Remove payment card error:", err.message);
    return res.status(500).json({ message: "Error removing payment card" });
  }
};

