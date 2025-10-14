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