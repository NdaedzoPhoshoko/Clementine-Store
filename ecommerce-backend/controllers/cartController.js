import pool from "../config/db.js";

export const getUserCart = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const cartResult = await pool.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE user_id=$1 AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(200).json({ cart: null, items: [], meta: { totalItems: 0, subtotal: 0 } });
    }

    const cart = cartResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              p.id AS product_id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cart.id]
    );

    const items = itemsResult.rows;

    let totalItems = 0;
    let subtotal = 0;
    for (const it of items) {
      totalItems += Number(it.quantity);
      subtotal += Number(it.quantity) * Number(it.price);
    }
    subtotal = Number(subtotal.toFixed(2));

    return res.status(200).json({ cart, items, meta: { totalItems, subtotal } });
  } catch (err) {
    console.error("Get user cart error:", err.message);
    return res.status(500).json({ message: "Error fetching cart" });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body || {};
    const userId = parseInt(req.user?.id, 10);
    const productId = parseInt(product_id, 10);
    const qty = Math.max(parseInt(quantity, 10) || 1, 1);

    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!productId || productId <= 0) {
      return res.status(400).json({ message: "Invalid product_id" });
    }

    const prodRes = await pool.query(
      "SELECT id, name, description, price, image_url, stock, category_id FROM products WHERE id=$1",
      [productId]
    );
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = prodRes.rows[0];

    // Get or create ACTIVE cart for user
    const cartRes = await pool.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE user_id=$1 AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    let cart = cartRes.rows[0];
    if (!cart) {
      const newCartRes = await pool.query(
        "INSERT INTO cart (user_id, status) VALUES ($1, 'ACTIVE') RETURNING id, user_id, status, created_at",
        [userId]
      );
      cart = newCartRes.rows[0];
    }

    // Check existing item to enforce stock constraint
    const existingItemRes = await pool.query(
      "SELECT id, quantity FROM cart_items WHERE cart_id=$1 AND product_id=$2",
      [cart.id, productId]
    );
    const existingQty = existingItemRes.rows.length ? parseInt(existingItemRes.rows[0].quantity, 10) : 0;
    const newQty = existingQty + qty;

    if (newQty > Number(product.stock)) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    const upsertRes = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING id, quantity, added_at`,
      [cart.id, productId, qty]
    );
    const cartItem = upsertRes.rows[0];

    // Fetch updated items to compute totals
    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              p.id AS product_id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cart.id]
    );
    const items = itemsRes.rows;

    let totalItems = 0;
    let subtotal = 0;
    for (const it of items) {
      totalItems += Number(it.quantity);
      subtotal += Number(it.quantity) * Number(it.price);
    }
    subtotal = Number(subtotal.toFixed(2));

    // Return added/updated item with product details as part of the items array
    return res.status(201).json({ cart, items, meta: { totalItems, subtotal } });
  } catch (err) {
    console.error("Add cart item error:", err.message);
    return res.status(500).json({ message: "Error adding cart item" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);
    const { quantity } = req.body || {};
    const userId = parseInt(req.user?.id, 10);
    const qty = Math.max(parseInt(quantity, 10) || 0, 0);

    if (!cartItemId || cartItemId <= 0) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const itemRes = await pool.query(
      `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, c.user_id, c.status
       FROM cart_items ci
       JOIN cart c ON c.id = ci.cart_id
       WHERE ci.id = $1`,
      [cartItemId]
    );
    if (itemRes.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const item = itemRes.rows[0];
    if (item.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: cart item does not belong to user" });
    }
    if (item.status !== "ACTIVE") {
      return res.status(400).json({ message: "Cannot modify items on a non-ACTIVE cart" });
    }

    const prodRes = await pool.query(
      "SELECT id, stock, price FROM products WHERE id=$1",
      [item.product_id]
    );
    const product = prodRes.rows[0];
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (qty > Number(product.stock)) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    await pool.query(
      "UPDATE cart_items SET quantity=$1 WHERE id=$2",
      [qty, cartItemId]
    );

    // Fetch updated cart and items
    const cartRes = await pool.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE id=$1",
      [item.cart_id]
    );
    const cart = cartRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              p.id AS product_id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [item.cart_id]
    );
    const items = itemsRes.rows;

    let totalItems = 0;
    let subtotal = 0;
    for (const it of items) {
      totalItems += Number(it.quantity);
      subtotal += Number(it.quantity) * Number(it.price);
    }
    subtotal = Number(subtotal.toFixed(2));

    return res.status(200).json({ cart, items, meta: { totalItems, subtotal } });
  } catch (err) {
    console.error("Update cart item error:", err.message);
    return res.status(500).json({ message: "Error updating cart item" });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user?.id, 10);

    if (!cartItemId || cartItemId <= 0) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const itemRes = await pool.query(
      `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, c.user_id, c.status
       FROM cart_items ci
       JOIN cart c ON c.id = ci.cart_id
       WHERE ci.id = $1`,
      [cartItemId]
    );
    if (itemRes.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const item = itemRes.rows[0];
    if (item.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: cart item does not belong to user" });
    }
    if (item.status !== "ACTIVE") {
      return res.status(400).json({ message: "Cannot modify items on a non-ACTIVE cart" });
    }

    await pool.query("DELETE FROM cart_items WHERE id=$1", [cartItemId]);

    // Fetch updated cart and items
    const cartRes = await pool.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE id=$1",
      [item.cart_id]
    );
    const cart = cartRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              p.id AS product_id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [item.cart_id]
    );
    const items = itemsRes.rows;

    let totalItems = 0;
    let subtotal = 0;
    for (const it of items) {
      totalItems += Number(it.quantity);
      subtotal += Number(it.quantity) * Number(it.price);
    }
    subtotal = Number(subtotal.toFixed(2));

    return res.status(200).json({ cart, items, meta: { totalItems, subtotal } });
  } catch (err) {
    console.error("Delete cart item error:", err.message);
    return res.status(500).json({ message: "Error deleting cart item" });
  }
};