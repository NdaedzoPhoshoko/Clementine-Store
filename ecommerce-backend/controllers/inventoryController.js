import pool from "../config/db.js";

export const getInventoryLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      changeType,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (productId) {
      params.push(parseInt(productId, 10));
      whereClauses.push(`il.product_id = $${params.length}`);
    }

    if (changeType) {
      params.push(changeType);
      whereClauses.push(`il.change_type = $${params.length}`);
    }

    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd.getTime())) {
        params.push(sd);
        whereClauses.push(`il.created_at >= $${params.length}`);
      }
    }

    if (endDate) {
      const ed = new Date(endDate);
      if (!isNaN(ed.getTime())) {
        params.push(ed);
        whereClauses.push(`il.created_at <= $${params.length}`);
      }
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM inventory_log il ${whereSql}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT il.id, il.product_id, p.name AS product_name, il.change_type, il.quantity_changed, il.created_at
      FROM inventory_log il
      LEFT JOIN products p ON p.id = il.product_id
      ${whereSql}
      ORDER BY il.created_at DESC, il.id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsRes = await pool.query(itemsQuery, itemsParams);
    const items = itemsRes.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("Get inventory logs error:", err.message);
    return res.status(500).json({ message: "Error fetching inventory logs" });
  }
};