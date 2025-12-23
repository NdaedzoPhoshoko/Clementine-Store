import pool from "../config/db.js";

export const getInventoryLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      changeType,
      source,
      size,
      colorHex,
      actorUserId,
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

    if (source) {
      params.push(source);
      whereClauses.push(`il.source = $${params.length}`);
    }

    if (size) {
      params.push(size);
      whereClauses.push(`il.size = $${params.length}`);
    }

    if (colorHex) {
      params.push(colorHex);
      whereClauses.push(`il.color_hex = $${params.length}`);
    }

    if (actorUserId) {
      params.push(parseInt(actorUserId, 10));
      whereClauses.push(`il.actor_user_id = $${params.length}`);
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
      SELECT
        il.id,
        il.product_id,
        p.name AS product_name,
        il.change_type,
        il.quantity_changed,
        il.size,
        il.color_hex,
        il.previous_stock,
        il.new_stock,
        il.source,
        il.reason,
        il.note,
        il.actor_user_id,
        u.name AS actor_name,
        il.order_id,
        il.cart_item_id,
        il.created_at
      FROM inventory_log il
      LEFT JOIN products p ON p.id = il.product_id
      LEFT JOIN users u ON u.id = il.actor_user_id
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

export const adjustStock = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      product_id,
      quantity_changed,
      change_type,
      size = '',
      color_hex = '',
      source = 'adjustment',
      reason = '',
      note = '',
      order_id = null,
      cart_item_id = null,
    } = req.body || {};

    const pid = parseInt(product_id, 10);
    const qty = parseInt(quantity_changed, 10);
    if (!pid || pid <= 0) {
      return res.status(400).json({ message: "Invalid product_id" });
    }
    if (!qty || qty === 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ message: "quantity_changed must be a non-zero integer" });
    }

    const actorId = parseInt(req.user?.id, 10) || null;
    const normalizedType = change_type
      ? String(change_type).toUpperCase()
      : (qty > 0 ? 'RESTOCK' : 'ADJUSTMENT');

    await client.query('BEGIN');
    const prodRes = await client.query('SELECT id, stock FROM products WHERE id=$1 FOR UPDATE', [pid]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Product not found" });
    }
    const previous_stock = parseInt(prodRes.rows[0].stock || 0, 10);
    const new_stock = previous_stock + qty;
    if (new_stock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Resulting stock cannot be negative" });
    }

    const updRes = await client.query('UPDATE products SET stock=$1 WHERE id=$2 RETURNING id, stock', [new_stock, pid]);
    const updated = updRes.rows[0];

    const insRes = await client.query(
      `INSERT INTO inventory_log
       (product_id, change_type, quantity_changed, previous_stock, new_stock, size, color_hex, source, reason, note, actor_user_id, order_id, cart_item_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, product_id, change_type, quantity_changed, previous_stock, new_stock, size, color_hex, source, reason, note, actor_user_id, order_id, cart_item_id, created_at`,
      [pid, normalizedType, qty, previous_stock, new_stock, size, color_hex, source, reason, note, actorId, order_id, cart_item_id]
    );
    const log = insRes.rows[0];
    await client.query('COMMIT');

    return res.status(201).json({
      product: { id: updated.id, stock: parseInt(updated.stock, 10) },
      log,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error("Adjust stock error:", err.message);
    return res.status(500).json({ message: "Error adjusting stock" });
  } finally {
    client.release();
  }
};

export const adjustStockBatch = async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = Array.isArray(req.body?.items) ? req.body.items : (Array.isArray(req.body) ? req.body : []);
    if (!payload.length) {
      return res.status(400).json({ message: "No items" });
    }
    const actorId = parseInt(req.user?.id, 10) || null;
    await client.query('BEGIN');
    const results = [];
    const logs = [];
    const group = new Map();
    for (const it of payload) {
      const pid = parseInt(it?.product_id, 10);
      const qty = parseInt(it?.quantity_changed, 10);
      if (!pid || pid <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: "Invalid product_id in batch" });
      }
      if (!qty || qty === 0 || !Number.isInteger(qty)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: "quantity_changed must be a non-zero integer in batch" });
      }
      const arr = group.get(pid) || [];
      arr.push({
        product_id: pid,
        quantity_changed: qty,
        change_type: it?.change_type,
        size: typeof it?.size === 'string' ? it.size : '',
        color_hex: typeof it?.color_hex === 'string' ? it.color_hex : '',
        source: it?.source || 'adjustment',
        reason: typeof it?.reason === 'string' ? it.reason : '',
        note: typeof it?.note === 'string' ? it.note : '',
        order_id: it?.order_id ?? null,
        cart_item_id: it?.cart_item_id ?? null,
      });
      group.set(pid, arr);
    }
    for (const [pid, items] of group.entries()) {
      const prodRes = await client.query('SELECT id, stock FROM products WHERE id=$1 FOR UPDATE', [pid]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "Product not found" });
      }
      let runningStock = parseInt(prodRes.rows[0].stock || 0, 10);
      for (const it of items) {
        const qty = it.quantity_changed;
        const normalizedType = it.change_type ? String(it.change_type).toUpperCase() : (qty > 0 ? 'RESTOCK' : 'ADJUSTMENT');
        const previous_stock = runningStock;
        const new_stock = previous_stock + qty;
        if (new_stock < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: "Resulting stock cannot be negative" });
        }
        const updRes = await client.query('UPDATE products SET stock=$1 WHERE id=$2 RETURNING id, stock', [new_stock, pid]);
        runningStock = parseInt(updRes.rows[0].stock, 10);
        const insRes = await client.query(
          `INSERT INTO inventory_log
           (product_id, change_type, quantity_changed, previous_stock, new_stock, size, color_hex, source, reason, note, actor_user_id, order_id, cart_item_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           RETURNING id, product_id, change_type, quantity_changed, previous_stock, new_stock, size, color_hex, source, reason, note, actor_user_id, order_id, cart_item_id, created_at`,
          [pid, normalizedType, qty, previous_stock, new_stock, it.size, it.color_hex, it.source, it.reason, it.note, actorId, it.order_id, it.cart_item_id]
        );
        logs.push(insRes.rows[0]);
      }
      results.push({ product_id: pid, final_stock: runningStock });
    }
    await client.query('COMMIT');
    return res.status(201).json({ products: results, logs });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error("Adjust stock batch error:", err.message);
    return res.status(500).json({ message: "Error adjusting stock batch" });
  } finally {
    client.release();
  }
};
