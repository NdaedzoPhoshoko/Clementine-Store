import pool from "../../config/db.js";

export const getHomeFeatures = async (req, res) => {
  try {
    const trendyQuery = `
      SELECT p.id AS product_id, p.name, p.image_url, COALESCE(SUM(oi.quantity), 0) AS total_sales
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY total_sales DESC, p.id DESC
      LIMIT 1
    `;
    const trendyRes = await pool.query(trendyQuery);
    const trendyRow = trendyRes.rows[0] || null;
    const trendy_product = trendyRow
      ? { product_id: trendyRow.product_id, name: trendyRow.name, image_url: trendyRow.image_url || null }
      : null;

    const arrivalQuery = `
      SELECT id AS product_id, name, image_url
      FROM products
      ORDER BY id DESC
      LIMIT 1
    `;
    const arrivalRes = await pool.query(arrivalQuery);
    const arrivalRow = arrivalRes.rows[0] || null;
    const new_arrival = arrivalRow
      ? { product_id: arrivalRow.product_id, name: arrivalRow.name, image_url: arrivalRow.image_url || null }
      : null;

    const featuredCatQuery = `
      WITH sales_by_cat AS (
        SELECT p.category_id AS category_id, COALESCE(SUM(oi.quantity), 0) AS cat_sales
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        WHERE p.category_id IS NOT NULL
        GROUP BY p.category_id
      )
      SELECT c.id AS category_id, c.name AS category_name, s.cat_sales
      FROM sales_by_cat s
      JOIN categories c ON c.id = s.category_id
      ORDER BY s.cat_sales DESC, c.id DESC
      LIMIT 1
    `;
    const featuredCatRes = await pool.query(featuredCatQuery);
    const featuredCat = featuredCatRes.rows[0] || null;

    let featured_collection = null;
    if (featuredCat && featuredCat.category_id) {
      const topProductQuery = `
        SELECT p.id AS product_id, p.name, p.image_url, COALESCE(SUM(oi.quantity), 0) AS product_sales
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        WHERE p.category_id = $1
        GROUP BY p.id
        ORDER BY product_sales DESC, p.id DESC
        LIMIT 1
      `;
      const topProdRes = await pool.query(topProductQuery, [featuredCat.category_id]);
      const topProd = topProdRes.rows[0] || null;
      featured_collection = {
        category_id: featuredCat.category_id,
        category_name: featuredCat.category_name,
        top_product: topProd
          ? { product_id: topProd.product_id, name: topProd.name, image_url: topProd.image_url || null }
          : null,
      };
    }

    const topRatedQuery = `
      SELECT p.id AS product_id, p.name, p.image_url,
             AVG(r.rating) AS avg_rating, COUNT(r.id) AS review_count
      FROM products p
      JOIN reviews r ON r.product_id = p.id
      GROUP BY p.id
      ORDER BY avg_rating DESC, review_count DESC, p.id DESC
      LIMIT 1
    `;
    const topRatedRes = await pool.query(topRatedQuery);
    const topRatedRow = topRatedRes.rows[0] || null;
    const top_rated = topRatedRow
      ? { product_id: topRatedRow.product_id, name: topRatedRow.name, image_url: topRatedRow.image_url || null }
      : null;

    const lowStockQuery = `
      SELECT id AS product_id, name, image_url, stock
      FROM products
      WHERE stock > 0
      ORDER BY stock ASC, id ASC
      LIMIT 1
    `;
    const lowStockRes = await pool.query(lowStockQuery);
    const lowStockRow = lowStockRes.rows[0] || null;
    const low_stock_alert = lowStockRow
      ? { product_id: lowStockRow.product_id, name: lowStockRow.name, image_url: lowStockRow.image_url || null }
      : null;

    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return res.status(200).json({
      trendy_product,
      new_arrival,
      featured_collection,
      top_rated,
      low_stock_alert,
    });
  } catch (err) {
    console.error("Home features error:", err.message);
    return res.status(500).json({ message: "Error fetching home features" });
  }
};

