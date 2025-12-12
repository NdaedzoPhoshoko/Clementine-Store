import pool from "../config/db.js";

export const getCategoryProducts = async (req, res) => {
  try {
    const idsParam = req.params.ids || req.params.id;
    if (!idsParam || idsParam.trim().length === 0) {
      return res.status(400).json({ message: "Invalid category ids" });
    }

    const idList = idsParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (idList.length === 0) {
      return res.status(400).json({ message: "Invalid category ids" });
    }

    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    // Fetch categories info
    const catsResult = await pool.query(
      "SELECT id, name, description FROM categories WHERE id = ANY($1::int[])",
      [idList]
    );
    if (catsResult.rows.length === 0) {
      return res.status(404).json({ message: "Categories not found" });
    }
    const categories = catsResult.rows;

    const whereClauses = ["category_id = ANY($1::int[])"];
    const params = [idList];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      whereClauses.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    }

    if (minPrice) {
      params.push(parseFloat(minPrice));
      whereClauses.push(`price >= $${params.length}`);
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      whereClauses.push(`price <= $${params.length}`);
    }

    if (typeof inStock !== "undefined") {
      const wantInStock = String(inStock).toLowerCase() === "true";
      if (wantInStock) {
        whereClauses.push(`stock > 0`);
      }
    }

    const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

    const countQuery = `SELECT COUNT(*) AS total FROM products ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT id, name, description, price, image_url, stock, category_id
      FROM products
      ${whereSql}
      ORDER BY id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=1200');
    return res.status(200).json({
      categories,
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("Get category products error:", err.message);
    return res.status(500).json({ message: "Error fetching category products" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const catResult = await pool.query(
      "SELECT id, name, description FROM categories WHERE id=$1",
      [id]
    );
    if (catResult.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    const category = catResult.rows[0];

    const countResult = await pool.query(
      "SELECT COUNT(*) AS product_count FROM products WHERE category_id=$1",
      [id]
    );
    const productCount = parseInt(countResult.rows[0]?.product_count || 0, 10);

    return res.status(200).json({
      category: { id: category.id, name: category.name, description: category.description },
      productCount,
    });
  } catch (err) {
    console.error("Get category error:", err.message);
    return res.status(500).json({ message: "Error fetching category" });
  }
};

export const listCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      // alias c for categories to avoid ambiguity
      whereClauses.push(`(c.name ILIKE $${idx} OR c.description ILIKE $${idx})`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM categories c ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT c.id, c.name, c.description
      FROM categories c
      ${whereSql}
      ORDER BY c.id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=1200');
    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("List categories error:", err.message);
    return res.status(500).json({ message: "Error fetching categories" });
  }
};

export const listCategoriesWithImages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      // alias c for categories to avoid ambiguity
      whereClauses.push(`(c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM categories c ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT
        c.id,
        c.name,
        c.description,
        COALESCE(pi.image_url, pl.image_url, '') AS image
      FROM categories c
      ${whereSql}
      LEFT JOIN LATERAL (
        SELECT p.image_url
        FROM products p
        WHERE p.category_id = c.id AND p.image_url IS NOT NULL
        ORDER BY p.id DESC
        LIMIT 1
      ) pl ON true
      LEFT JOIN LATERAL (
        SELECT pi.image_url
        FROM product_images pi
        JOIN products p2 ON p2.id = pi.product_id
        WHERE p2.category_id = c.id
        ORDER BY pi.id DESC
        LIMIT 1
      ) pi ON true
      ORDER BY c.id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=1200');
    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("List categories with images error:", err.message);
    return res.status(500).json({ message: "Error fetching categories with images" });
  }
};

export const addCategoriesBulk = async (req, res) => {
  try {
    const { categories } = req.body || {};

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: "Provide a non-empty 'categories' array" });
    }

    // Normalize and validate input; deduplicate by name
    const prepared = [];
    const seen = new Set();
    for (const item of categories) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const description = typeof item?.description === "string" ? item.description.trim() : null;
      if (!name) {
        return res.status(400).json({ message: "Each category must have a non-empty name" });
      }
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        prepared.push({ name, description });
      }
    }

    if (prepared.length === 0) {
      return res.status(400).json({ message: "No valid categories to add" });
    }

    // Insert using ON CONFLICT(name) DO NOTHING to skip duplicates
    const inserted = [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const c of prepared) {
        const result = await client.query(
          `INSERT INTO categories (name, description)
           VALUES ($1, $2)
           ON CONFLICT (name) DO NOTHING
           RETURNING id, name, description`,
          [c.name, c.description]
        );
        if (result.rows.length > 0) {
          inserted.push(result.rows[0]);
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const insertedNames = new Set(inserted.map((r) => r.name.toLowerCase()));
    const skipped = prepared
      .filter((c) => !insertedNames.has(c.name.toLowerCase()))
      .map((c) => ({ name: c.name }));

    res.set('Cache-Control', 'no-store');
    return res.status(201).json({ inserted, skipped });
  } catch (err) {
    console.error("Add categories bulk error:", err.message);
    return res.status(500).json({ message: "Error adding categories" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const { name, description } = req.body || {};
    const hasName = typeof name !== "undefined";
    const hasDescription = typeof description !== "undefined";

    if (!hasName && !hasDescription) {
      return res.status(400).json({ message: "Provide at least one field to update: name or description" });
    }

    const fields = [];
    const params = [];

    if (hasName) {
      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) {
        return res.status(400).json({ message: "Category name must be a non-empty string" });
      }
      params.push(trimmedName);
      fields.push(`name = $${params.length}`);
    }

    if (hasDescription) {
      const descVal = typeof description === "string" ? description.trim() : null;
      params.push(descVal);
      fields.push(`description = $${params.length}`);
    }

    params.push(id);
    const sql = `UPDATE categories SET ${fields.join(", ")} WHERE id = $${params.length} RETURNING id, name, description`;

    try {
      const result = await pool.query(sql, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.set('Cache-Control', 'no-store');
      return res.status(200).json({ category: result.rows[0] });
    } catch (err) {
      // Handle unique violation on name
      if (err && err.code === "23505") {
        return res.status(409).json({ message: "Category name already exists" });
      }
      throw err;
    }
  } catch (err) {
    console.error("Update category error:", err.message);
    return res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const result = await pool.query(
      "DELETE FROM categories WHERE id=$1 RETURNING id, name, description",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ category: result.rows[0] });
  } catch (err) {
    console.error("Delete category error:", err.message);
    return res.status(500).json({ message: "Error deleting category" });
  }
};

export const getCategorySalesSummary = async (req, res) => {
  try {
    const period = String(req.query.period || '').toLowerCase();
    const paidOnly = String(req.query.paidOnly || 'true').toLowerCase();
    const pageNum = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 200);
    const offset = (pageNum - 1) * limitNum;

    const startParam = req.query.startDate ? new Date(req.query.startDate) : null;
    const endParam = req.query.endDate ? new Date(req.query.endDate) : null;

    let startDate = null;
    let endDate = null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (startParam && !isNaN(startParam.getTime())) startDate = startParam;
    if (endParam && !isNaN(endParam.getTime())) endDate = endParam;
    if (!startDate && !endDate) {
      if (period === 'last_month') {
        const s = new Date(startOfMonth);
        s.setMonth(s.getMonth() - 1);
        startDate = s;
        endDate = startOfMonth;
      } else if (period === 'last_2_months') {
        const s = new Date(startOfMonth);
        s.setMonth(s.getMonth() - 2);
        startDate = s;
        endDate = startOfMonth;
      } else if (period === 'last_3_months') {
        const s = new Date(startOfMonth);
        s.setMonth(s.getMonth() - 3);
        startDate = s;
        endDate = startOfMonth;
      } else if (period === 'prev_quarter') {
        const q = Math.floor(now.getMonth() / 3);
        const prevQ = (q + 3 - 1) % 4;
        const year = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const startMonth = prevQ * 3;
        const endMonth = startMonth + 3;
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, endMonth, 1);
      }
    }

    const params = [];
    const onFilters = [];
    if (paidOnly === 'true' || paidOnly === '1') {
      onFilters.push(`o.payment_status IS NOT NULL AND o.payment_status <> 'PENDING'`);
    }
    if (startDate) {
      params.push(startDate.toISOString());
      onFilters.push(`o.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate.toISOString());
      onFilters.push(`o.created_at < $${params.length}`);
    }
    const joinOn = onFilters.length ? ` AND ${onFilters.join(' AND ')}` : '';

    const totalQuery = `SELECT COUNT(*)::int AS total FROM categories c`;
    const totalResult = await pool.query(totalQuery);
    const total = totalResult.rows[0]?.total || 0;

    const itemsQuery = `
      SELECT c.id AS category_id, c.name AS category_name, COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END), 0)::int AS items_sold
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id${joinOn}
      GROUP BY c.id, c.name
      ORDER BY items_sold DESC, c.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const itemsResult = await pool.query(itemsQuery, [...params, limitNum, offset]);
    const items = itemsResult.rows;
    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const meta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: pages,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      period: period || (startDate || endDate ? 'custom' : 'all_time'),
    };
    return res.status(200).json({ items, meta });
  } catch (err) {
    console.error('Category sales summary error:', err.message);
    return res.status(500).json({ message: 'Error fetching category sales summary' });
  }
};
