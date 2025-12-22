import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

export const listProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      whereClauses.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    }

    if (categoryId) {
      params.push(parseInt(categoryId, 10));
      whereClauses.push(`category_id = $${params.length}`);
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

    const whereClauses2 = whereClauses.map(clause => clause.replace(/^(\w+)/, 'p.$1'));
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const whereSqlWithP = whereClauses.length ? `WHERE ${whereClauses2.join(" AND ")}` : "";

    // total count
    const countQuery = `SELECT COUNT(*) AS total FROM products ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // items query
    const itemsParams = [...params, limitNum, offset];
    const itemsQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id,
             p.details, p.dimensions, p.care_notes, p.sustainability_notes,
             p.color_variants,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereSqlWithP}
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}
    `;
    const itemsResult = await pool.query(itemsQuery, itemsParams);
    const items = itemsResult.rows.map(item => ({
      ...item,
      average_rating: parseFloat(item.average_rating),
      review_count: parseInt(item.review_count, 10)
    }));

    const pages = Math.max(Math.ceil(total / limitNum), 1);
    const hasNext = pageNum < pages;
    const hasPrev = pageNum > 1;

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json({
      items,
      meta: { page: pageNum, limit: limitNum, total, pages, hasNext, hasPrev },
    });
  } catch (err) {
    console.error("List products error:", err.message);
    return res.status(500).json({ message: "Error fetching products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const productQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id,
             p.details, p.dimensions, p.care_notes, p.sustainability_notes,
             p.color_variants,
             c.name AS category_name, c.description AS category_description
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `;
    const productResult = await pool.query(productQuery, [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const p = productResult.rows[0];

    const imagesResult = await pool.query(
      "SELECT image_url FROM product_images WHERE product_id=$1 ORDER BY id ASC",
      [id]
    );
    const images = imagesResult.rows.map((r) => r.image_url);

    const reviewsResult = await pool.query(
      "SELECT id, user_id, rating, comment, created_at FROM reviews WHERE product_id=$1 ORDER BY created_at DESC",
      [id]
    );
    const reviews = reviewsResult.rows;

    const statsResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [id]
    );
    const reviewStats = {
      averageRating: parseFloat(statsResult.rows[0].average_rating),
      reviewCount: parseInt(statsResult.rows[0].review_count, 10),
    };

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res.status(200).json({
      product: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        stock: p.stock,
        details: p.details,
        dimensions: p.dimensions,
        care_notes: p.care_notes,
        sustainability_notes: p.sustainability_notes,
        color_variants: p.color_variants,
      },
      category: p.category_id
        ? { id: p.category_id, name: p.category_name, description: p.category_description }
        : null,
      images,
      reviews,
      reviewStats,
    });
  } catch (err) {
    console.error("Get product error:", err.message);
    return res.status(500).json({ message: "Error fetching product details" });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    // Verify product exists to return 404 if not
    const productExists = await pool.query("SELECT id FROM products WHERE id=$1", [id]);
    if (productExists.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch reviews with basic user info
    const reviewsQuery = `
      SELECT r.id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `;
    const reviewsResult = await pool.query(reviewsQuery, [id]);
    const reviews = reviewsResult.rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user_name || null,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    }));

    const statsResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=$1",
      [id]
    );
    const stats = {
      averageRating: parseFloat(statsResult.rows[0].average_rating),
      reviewCount: parseInt(statsResult.rows[0].review_count, 10),
    };

    let haveOrdered = "require signin";
    const uid = parseInt(req.user?.id, 10);
    if (uid && uid > 0) {
      const ordRes = await pool.query(
        `SELECT 1
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = $1 AND oi.product_id = $2
         LIMIT 1`,
        [uid, id]
      );
      haveOrdered = ordRes.rows.length > 0 ? "ordered" : "not ordered";
    }

    res.set('Cache-Control', 'private, no-store');
    return res.status(200).json({ reviews, stats, haveOrdered });
  } catch (err) {
    console.error("Get product reviews error:", err.message);
    return res.status(500).json({ message: "Error fetching product reviews" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants } = req.body || {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const priceNum = parseFloat(price);
    const stockNum = typeof stock !== "undefined" ? parseInt(stock, 10) : 0;
    const categoryIdNum = typeof category_id !== "undefined" && category_id !== null ? parseInt(category_id, 10) : null;

    // Parse and validate JSONB fields
    let detailsJson = null;
    let dimensionsJson = null;
    let careNotesJson = null;
    let sustainabilityNotesJson = null;
    let colorVariantsJson = null;

    if (details !== undefined) {
      if (details === null) {
        detailsJson = null;
      } else if (typeof details === 'string') {
        const trimmed = details.trim();
        if (trimmed === "") {
          detailsJson = null;
        } else {
          try {
            detailsJson = JSON.parse(trimmed);
          } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for details" });
          }
        }
      } else {
        detailsJson = details;
      }
      if (detailsJson !== null && !Array.isArray(detailsJson) && typeof detailsJson !== 'object') {
        return res.status(400).json({ message: "Details must be an array or object" });
      }
    }

    if (dimensions !== undefined) {
      if (dimensions === null) {
        dimensionsJson = null;
      } else if (typeof dimensions === 'string') {
        const trimmed = dimensions.trim();
        if (trimmed === "") {
          dimensionsJson = null;
        } else {
          try {
            dimensionsJson = JSON.parse(trimmed);
          } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for dimensions" });
          }
        }
      } else {
        dimensionsJson = dimensions;
      }
      if (dimensionsJson !== null && !Array.isArray(dimensionsJson) && typeof dimensionsJson !== 'object') {
        return res.status(400).json({ message: "Dimensions must be an array or object" });
      }
    }

    if (care_notes !== undefined) {
      if (care_notes === null) {
        careNotesJson = null;
      } else if (typeof care_notes === 'string') {
        const trimmed = care_notes.trim();
        if (trimmed === "") {
          careNotesJson = null;
        } else {
          try {
            // First try to parse as JSON
            careNotesJson = JSON.parse(trimmed);
          } catch (err) {
            // If JSON parsing fails, treat as comma-separated string and convert to array
            careNotesJson = trimmed.split(',').map(item => item.trim()).filter(item => item.length > 0);
          }
        }
      } else {
        careNotesJson = care_notes;
      }
      if (careNotesJson !== null && !Array.isArray(careNotesJson) && typeof careNotesJson !== 'object') {
        return res.status(400).json({ message: "Care notes must be an array or object" });
      }
    }

    if (sustainability_notes !== undefined) {
      if (sustainability_notes === null) {
        sustainabilityNotesJson = null;
      } else if (typeof sustainability_notes === 'string') {
        const trimmed = sustainability_notes.trim();
        if (trimmed === "") {
          sustainabilityNotesJson = null;
        } else {
          try {
            sustainabilityNotesJson = JSON.parse(trimmed);
          } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for sustainability_notes" });
          }
        }
      } else {
        sustainabilityNotesJson = sustainability_notes;
      }
      if (sustainabilityNotesJson !== null && !Array.isArray(sustainabilityNotesJson) && typeof sustainabilityNotesJson !== 'object') {
        return res.status(400).json({ message: "Sustainability notes must be an array or object" });
      }
    }

    if (color_variants !== undefined) {
      if (color_variants === null) {
        colorVariantsJson = null;
      } else if (typeof color_variants === 'string') {
        const trimmed = color_variants.trim();
        if (trimmed === "") {
          colorVariantsJson = null;
        } else {
          try {
            colorVariantsJson = JSON.parse(trimmed);
          } catch (err) {
            return res.status(400).json({ message: "Invalid JSON format for color_variants" });
          }
        }
      } else {
        colorVariantsJson = color_variants;
      }
      if (colorVariantsJson !== null && !Array.isArray(colorVariantsJson) && typeof colorVariantsJson !== 'object') {
        return res.status(400).json({ message: "color_variants must be an array or object" });
      }
    }

    if (!trimmedName) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: "Stock must be a non-negative integer" });
    }

    if (categoryIdNum !== null) {
      const catRes = await pool.query("SELECT id FROM categories WHERE id=$1", [categoryIdNum]);
      if (catRes.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Require an image file and upload it to Cloudinary
    let primaryImageUrl = null;
    let publicId = null;
    if (req.file && req.file.buffer) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products", resource_type: "image" },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(req.file.buffer);
      });
      primaryImageUrl = result?.secure_url || null;
      publicId = result?.public_id || null;
      if (!primaryImageUrl) {
        return res.status(500).json({ message: "Upload failed: no URL returned" });
      }
    } else {
      return res.status(400).json({ message: "Image file is required under 'image' field" });
    }


    const insertQuery = `
      INSERT INTO products (name, description, price, image_url, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, description, price, image_url, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants
    `;
    const insertParams = [
      trimmedName,
      description || null,
      priceNum,
      primaryImageUrl,
      stockNum,
      categoryIdNum,
      detailsJson !== null ? JSON.stringify(detailsJson) : null,
      dimensionsJson !== null ? JSON.stringify(dimensionsJson) : null,
      careNotesJson !== null ? JSON.stringify(careNotesJson) : null,
      sustainabilityNotesJson !== null ? JSON.stringify(sustainabilityNotesJson) : null,
      colorVariantsJson !== null ? JSON.stringify(colorVariantsJson) : null,
    ];
    const result = await pool.query(insertQuery, insertParams);
    const product = result.rows[0];

    // Track uploaded image in product_images table
    await pool.query(
      "INSERT INTO product_images (product_id, image_url, public_id) VALUES ($1, $2, $3)",
      [product.id, primaryImageUrl, publicId]
    );

    return res.status(201).json({ product });
  } catch (err) {
    console.error("Create product error:", err.message);
    return res.status(500).json({ message: "Error creating product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, description, price, image_url, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants FROM products WHERE id=$1",
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existing = existingRes.rows[0];

    const { name, description, price, image_url, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants } = req.body || {};

    // Validate provided fields only
    if (typeof name !== "undefined") {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Product name cannot be empty" });
      }
      existing.name = trimmedName;
    }

    if (typeof description !== "undefined") {
      existing.description = description || null;
    }

    if (typeof price !== "undefined") {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number" });
      }
      existing.price = priceNum;
    }

    if (typeof image_url !== "undefined") {
      existing.image_url = image_url || null;
    }

    if (typeof stock !== "undefined") {
      const stockNum = parseInt(stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ message: "Stock must be a non-negative integer" });
      }
      existing.stock = stockNum;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "category_id")) {
      // Allow setting to null or a valid category id
      if (category_id === null || typeof category_id === "undefined") {
        existing.category_id = null;
      } else {
        const categoryIdNum = parseInt(category_id, 10);
        if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
          return res.status(400).json({ message: "Invalid category_id" });
        }
        const catRes = await pool.query("SELECT id FROM categories WHERE id=$1", [categoryIdNum]);
        if (catRes.rows.length === 0) {
          return res.status(404).json({ message: "Category not found" });
        }
        existing.category_id = categoryIdNum;
      }
    }

    // Handle JSONB fields
    if (typeof details !== "undefined") {
      if (details === null) {
        existing.details = null;
      } else {
        try {
          const detailsJson = typeof details === 'string' ? JSON.parse(details) : details;
          if (!Array.isArray(detailsJson) && typeof detailsJson !== 'object') {
            return res.status(400).json({ message: "Details must be an array or object" });
          }
          existing.details = detailsJson;
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON format for details" });
        }
      }
    }

    if (typeof dimensions !== "undefined") {
      if (dimensions === null) {
        existing.dimensions = null;
      } else {
        try {
          const dimensionsJson = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
          if (!Array.isArray(dimensionsJson) && typeof dimensionsJson !== 'object') {
            return res.status(400).json({ message: "Dimensions must be an array or object" });
          }
          existing.dimensions = dimensionsJson;
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON format for dimensions" });
        }
      }
    }

    if (typeof care_notes !== "undefined") {
      if (care_notes === null) {
        existing.care_notes = null;
      } else {
        try {
          const careNotesJson = typeof care_notes === 'string' ? JSON.parse(care_notes) : care_notes;
          if (!Array.isArray(careNotesJson) && typeof careNotesJson !== 'object') {
            return res.status(400).json({ message: "Care notes must be an array or object" });
          }
          existing.care_notes = careNotesJson;
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON format for care_notes" });
        }
      }
    }

    if (typeof sustainability_notes !== "undefined") {
      if (sustainability_notes === null) {
        existing.sustainability_notes = null;
      } else {
        try {
          const sustainabilityNotesJson = typeof sustainability_notes === 'string' ? JSON.parse(sustainability_notes) : sustainability_notes;
          if (!Array.isArray(sustainabilityNotesJson) && typeof sustainabilityNotesJson !== 'object') {
            return res.status(400).json({ message: "Sustainability notes must be an array or object" });
          }
          existing.sustainability_notes = sustainabilityNotesJson;
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON format for sustainability_notes" });
        }
      }
    }

    if (typeof color_variants !== "undefined") {
      if (color_variants === null) {
        existing.color_variants = null;
      } else {
        try {
          const colorVariantsJson = typeof color_variants === 'string' ? JSON.parse(color_variants) : color_variants;
          if (!Array.isArray(colorVariantsJson) && typeof colorVariantsJson !== 'object') {
            return res.status(400).json({ message: "color_variants must be an array or object" });
          }
          existing.color_variants = colorVariantsJson;
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON format for color_variants" });
        }
      }
    }

    // Ensure JSONB fields are stringified consistently (matching createProduct)
    const detailsOut = existing.details !== null ? JSON.stringify(existing.details) : null;
    const dimensionsOut = existing.dimensions !== null ? JSON.stringify(existing.dimensions) : null;
    const careNotesOut = existing.care_notes !== null ? JSON.stringify(existing.care_notes) : null;
    const sustainabilityNotesOut = existing.sustainability_notes !== null ? JSON.stringify(existing.sustainability_notes) : null;
    const colorVariantsOut = existing.color_variants !== null ? JSON.stringify(existing.color_variants) : null;

    const updateQuery = `
      UPDATE products
      SET name=$1, description=$2, price=$3, image_url=$4, stock=$5, category_id=$6, details=$7, dimensions=$8, care_notes=$9, sustainability_notes=$10, color_variants=$11
      WHERE id=$12
      RETURNING id, name, description, price, image_url, stock, category_id, details, dimensions, care_notes, sustainability_notes, color_variants
    `;
    const updateParams = [
      existing.name,
      existing.description,
      existing.price,
      existing.image_url,
      existing.stock,
      existing.category_id,
      detailsOut,
      dimensionsOut,
      careNotesOut,
      sustainabilityNotesOut,
      colorVariantsOut,
      id,
    ];
    const result = await pool.query(updateQuery, updateParams);
    const product = result.rows[0];

    return res.status(200).json({ product });
  } catch (err) {
    console.error("Update product error:", err.message);
    return res.status(500).json({ message: "Error updating product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingRes = await pool.query(
      "SELECT id, name, description, price, image_url, stock, category_id FROM products WHERE id=$1",
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = existingRes.rows[0];

    await pool.query("DELETE FROM products WHERE id=$1", [id]);

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ message: "Product deleted", product });
  } catch (err) {
    console.error("Delete product error:", err.message);
    return res.status(500).json({ message: "Error deleting product" });
  }
};

export const uploadProductImage = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || id <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existingRes = await pool.query(
      "SELECT id, image_url FROM products WHERE id=$1",
      [id]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Collect files from either 'images' (array) or 'image' (single), remaining backward-compatible
    let files = [];
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      files = files.concat(req.files.images);
    }
    if (req.files && req.files.image && Array.isArray(req.files.image)) {
      files = files.concat(req.files.image);
    }
    // Fallback if older middleware put single file into req.file
    if ((!files || files.length === 0) && req.file && req.file.buffer) {
      files = [req.file];
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const uploaded = [];
    for (const f of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products", resource_type: "image" },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(f.buffer);
      });

      const secureUrl = result?.secure_url;
      const publicId = result?.public_id;
      if (!secureUrl) {
        return res.status(500).json({ message: "Upload failed: no URL returned" });
      }

      const currentPrimary = existingRes.rows[0].image_url;
      const dupCheck = await pool.query(
        "SELECT 1 FROM product_images WHERE product_id=$1 AND (image_url=$2 OR (public_id IS NOT NULL AND public_id=$3)) LIMIT 1",
        [id, secureUrl, publicId || ""]
      );
      const isDuplicate = dupCheck.rows.length > 0 || (currentPrimary && currentPrimary === secureUrl);
      if (!isDuplicate) {
        await pool.query(
          "INSERT INTO product_images (product_id, image_url, public_id) VALUES ($1, $2, $3)",
          [id, secureUrl, publicId || null]
        );
        uploaded.push({ url: secureUrl, public_id: publicId });
      }
    }

    // Set primary image if none exists yet using the first uploaded image
    let updatedPrimary = false;
    const currentPrimary = existingRes.rows[0].image_url;
    if (!currentPrimary && uploaded.length > 0) {
      await pool.query("UPDATE products SET image_url=$1 WHERE id=$2", [uploaded[0].url, id]);
      updatedPrimary = true;
    }

    res.set('Cache-Control', 'no-store');
    return res.status(201).json({
      images: uploaded,
      productId: id,
      updatedPrimary,
      
    });
  } catch (err) {
    console.error("Upload product image error:", err.message);
    return res.status(500).json({ message: "Error uploading product image" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const imageId = parseInt(req.params.imageId, 10);
    if (!productId || productId <= 0 || !imageId || imageId <= 0) {
      return res.status(400).json({ message: "Invalid product or image id" });
    }

    const productRes = await pool.query(
      "SELECT id, image_url FROM products WHERE id=$1",
      [productId]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = productRes.rows[0];

    const imageRes = await pool.query(
      "SELECT id, image_url, public_id FROM product_images WHERE id=$1 AND product_id=$2",
      [imageId, productId]
    );
    if (imageRes.rows.length === 0) {
      return res.status(404).json({ message: "Product image not found" });
    }
    const imageRow = imageRes.rows[0];
    const imageUrl = imageRow.image_url;
    let publicId = imageRow.public_id;

    // Attempt to delete from Cloudinary based on URL-derived public_id (best-effort)
    const derivePublicIdFromUrl = (url) => {
      try {
        const u = new URL(url);
        const parts = u.pathname.split("/");
        const uploadIdx = parts.indexOf("upload");
        if (uploadIdx === -1) return null;
        let idx = uploadIdx + 1;
        // skip version segment if present (e.g., v1691234567)
        if (parts[idx] && parts[idx].startsWith("v")) idx++;
        // remaining path includes folder and filename
        const remainder = parts.slice(idx);
        if (!remainder.length) return null;
        const last = remainder.pop();
        const base = last.split(".")[0]; // drop extension
        remainder.push(base);
        return remainder.join("/");
      } catch (e) {
        return null;
      }
    };

    if (!publicId) publicId = derivePublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (cloudErr) {
        console.warn("Cloudinary destroy failed:", cloudErr?.message || cloudErr);
      }
    }

    // Delete DB record
    await pool.query("DELETE FROM product_images WHERE id=$1", [imageId]);

    // If it was the primary image, set a new one or clear
    let updatedPrimary = false;
    let newPrimaryUrl = null;
    if (product.image_url === imageUrl) {
      const nextRes = await pool.query(
        "SELECT image_url FROM product_images WHERE product_id=$1 ORDER BY id ASC LIMIT 1",
        [productId]
      );
      if (nextRes.rows.length > 0) {
        newPrimaryUrl = nextRes.rows[0].image_url;
        await pool.query("UPDATE products SET image_url=$1 WHERE id=$2", [newPrimaryUrl, productId]);
      } else {
        await pool.query("UPDATE products SET image_url=NULL WHERE id=$1", [productId]);
      }
      updatedPrimary = true;
    }

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      message: "Image deleted",
      deletedImageId: imageId,
      productId,
      updatedPrimary,
      newPrimaryUrl,
    });
  } catch (err) {
    console.error("Delete product image error:", err.message);
    return res.status(500).json({ message: "Error deleting product image" });
  }
};

export const deleteAllProductImages = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const productRes = await pool.query(
      "SELECT id, image_url FROM products WHERE id=$1",
      [productId]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = productRes.rows[0];

    const imagesRes = await pool.query(
      "SELECT id, image_url, public_id FROM product_images WHERE product_id=$1 ORDER BY id ASC",
      [productId]
    );
    const images = imagesRes.rows;

    // Collect unique URLs including primary image
    const urlSet = new Set(images.map(i => i.image_url));
    if (product.image_url) urlSet.add(product.image_url);

    const derivePublicIdFromUrl = (url) => {
      try {
        const u = new URL(url);
        const parts = u.pathname.split("/");
        const uploadIdx = parts.indexOf("upload");
        if (uploadIdx === -1) return null;
        let idx = uploadIdx + 1;
        if (parts[idx] && parts[idx].startsWith("v")) idx++;
        const remainder = parts.slice(idx);
        if (!remainder.length) return null;
        const last = remainder.pop();
        const base = last.split(".")[0];
        remainder.push(base);
        return remainder.join("/");
      } catch {
        return null;
      }
    };

    let attempted = 0;
    let cloudDeleted = 0;
    // Prefer stored public_id; fall back to URL derivation when missing
    for (const row of images) {
      let pid = row.public_id;
      if (!pid) pid = derivePublicIdFromUrl(row.image_url);
      if (pid) {
        attempted++;
        try {
          const resDestroy = await cloudinary.uploader.destroy(pid, { invalidate: true });
          if (resDestroy && (resDestroy.result === "ok" || resDestroy.result === "not found")) {
            cloudDeleted++;
          }
        } catch (e) {
          // best-effort: continue
        }
      }
    }
    // Also attempt to delete primary image if it’s not present in product_images rows (edge case)
    if (product.image_url && !images.some(r => r.image_url === product.image_url)) {
      const pid = derivePublicIdFromUrl(product.image_url);
      if (pid) {
        attempted++;
        try {
          const resDestroy = await cloudinary.uploader.destroy(pid, { invalidate: true });
          if (resDestroy && (resDestroy.result === "ok" || resDestroy.result === "not found")) {
            cloudDeleted++;
          }
        } catch {}
      }
    }

    // Delete all DB image rows
    await pool.query("DELETE FROM product_images WHERE product_id=$1", [productId]);

    // Clear primary image
    let updatedPrimary = false;
    if (product.image_url) {
      await pool.query("UPDATE products SET image_url=NULL WHERE id=$1", [productId]);
      updatedPrimary = true;
    }

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      message: "All product images deleted",
      productId,
      deletedCount: images.length,
      cloudinaryDeleteAttempted: attempted,
      cloudinaryDeleted: cloudDeleted,
      updatedPrimary,
    });
  } catch (err) {
    console.error("Delete all product images error:", err.message);
    return res.status(500).json({ message: "Error deleting all product images" });
  }
};

export const getLatestProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.image_url, p.name, p.description, p.price,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      GROUP BY p.id
      ORDER BY p.id DESC 
      LIMIT 20
    `);
    
    const products = result.rows.map(item => ({
      ...item,
      average_rating: parseFloat(item.average_rating),
      review_count: parseInt(item.review_count, 10)
    }));
    
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json(products);
  } catch (err) {
    console.error("Get latest products error:", err.message);
    return res.status(500).json({ message: "Error fetching latest products" });
  }
};

export const autocompleteProductNames = async (req, res) => {
  try {
    const { q = "", limit = 10 } = req.query;
    const query = String(q).trim();
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    if (!query) {
      return res.status(200).json({ names: [], categories: [], total: 0 });
    }

    // Query for product names that match the search term anywhere in the name
    const productSql = `
      SELECT p.name,
             CASE 
               WHEN LOWER(p.name) LIKE LOWER($1) || '%' THEN 0
               WHEN LOWER(p.name) LIKE '%' || LOWER($1) || '%' THEN 1
               ELSE 2
             END AS match_type
      FROM products p
      WHERE LOWER(p.name) LIKE '%' || LOWER($1) || '%'
      ORDER BY match_type, p.name ASC
      LIMIT $2
    `;
    
    // Query for category names that match the search term anywhere in the name
    const categorySql = `
      SELECT c.name,
             CASE 
               WHEN LOWER(c.name) LIKE LOWER($1) || '%' THEN 0
               WHEN LOWER(c.name) LIKE '%' || LOWER($1) || '%' THEN 1
               ELSE 2
             END AS match_type
      FROM categories c
      WHERE LOWER(c.name) LIKE '%' || LOWER($1) || '%'
      ORDER BY match_type, c.name ASC
      LIMIT $2
    `;
    
    // Get the count of matching products and categories
    const countSql = `
      SELECT 
        (SELECT COUNT(*) FROM products p WHERE LOWER(p.name) LIKE '%' || LOWER($1) || '%') +
        (SELECT COUNT(*) FROM categories c WHERE LOWER(c.name) LIKE '%' || LOWER($1) || '%') AS total
    `;
    
    // Run all queries in parallel for better performance
    const [productRes, categoryRes, countRes] = await Promise.all([
      pool.query(productSql, [query, limitNum]),
      pool.query(categorySql, [query, limitNum]),
      pool.query(countSql, [query])
    ]);
    
    const productNames = productRes.rows.map(r => r.name);
    const categoryNames = categoryRes.rows.map(r => r.name);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    return res.status(200).json({ 
      names: productNames, 
      categories: categoryNames,
      total 
    });
  } catch (err) {
    console.error("Autocomplete product names error:", err.message);
    return res.status(500).json({ message: "Error fetching product name suggestions" });
  }
};
