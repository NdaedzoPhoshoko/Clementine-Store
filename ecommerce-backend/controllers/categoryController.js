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
      whereClauses.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM categories ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT id, name, description
      FROM categories
      ${whereSql}
      ORDER BY id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows;

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("List categories error:", err.message);
    return res.status(500).json({ message: "Error fetching categories" });
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

    return res.status(200).json({ category: result.rows[0] });
  } catch (err) {
    console.error("Delete category error:", err.message);
    return res.status(500).json({ message: "Error deleting category" });
  }
};