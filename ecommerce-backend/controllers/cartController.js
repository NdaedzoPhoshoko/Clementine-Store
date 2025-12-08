import pool from "../config/db.js";

export const getUserCart = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const cartResult = await pool.query(
      "SELECT id, user_id, status, created_at FROM cart WHERE user_id=$1 AND status IN ('ACTIVE', 'CHECKOUT_IN_PROGRESS') ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(200).json({ cart: null, items: [], meta: { totalItems: 0, subtotal: 0 } });
    }

    const cart = cartResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              ci.size, ci.color_hex,
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
    const { product_id, quantity = 1, size, color_hex } = req.body || {};
    const userId = parseInt(req.user?.id, 10);
    const productId = parseInt(product_id, 10);
    const qty = Math.max(parseInt(quantity, 10) || 1, 1);
    const sizeStr = typeof size === "string" ? size.trim() : "";
    const colorHexStr = typeof color_hex === "string" ? color_hex.trim() : "";

    if (colorHexStr) {
      const hexOk = /^#?[0-9A-Fa-f]{3,8}$/.test(colorHexStr);
      if (!hexOk) {
        return res.status(400).json({ message: "Invalid color_hex format" });
      }
    }

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
      "SELECT id, quantity FROM cart_items WHERE cart_id=$1 AND product_id=$2 AND size=$3 AND color_hex=$4",
      [cart.id, productId, sizeStr, colorHexStr]
    );
    const existingQty = existingItemRes.rows.length ? parseInt(existingItemRes.rows[0].quantity, 10) : 0;
    const newQty = existingQty + qty;

    if (newQty > Number(product.stock)) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    let cartItem;
    if (existingItemRes.rows.length > 0) {
      // Item exists: update quantity
      const updateRes = await pool.query(
        "UPDATE cart_items SET quantity=$1 WHERE id=$2 RETURNING id, quantity, added_at, size, color_hex",
        [newQty, existingItemRes.rows[0].id]
      );
      cartItem = updateRes.rows[0];
    } else {
      // Item does not exist: insert new
      const insertRes = await pool.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity, size, color_hex) VALUES ($1, $2, $3, $4, $5) RETURNING id, quantity, added_at, size, color_hex",
        [cart.id, productId, qty, sizeStr, colorHexStr]
      );
      cartItem = insertRes.rows[0];
    }

    // Fetch updated items to compute totals
    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
              ci.size, ci.color_hex,
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
      `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, c.user_id, c.status AS cart_status
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
    if (item.cart_status !== "ACTIVE") {
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
              ci.size, ci.color_hex,
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

export const clearUserCart = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Start transaction
    await pool.query("BEGIN");

    // 1. Get the user's active cart
    const cartResult = await pool.query(
      "SELECT id FROM cart WHERE user_id = $1 AND status = 'ACTIVE'",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "No active cart found" });
    }

    const cartId = cartResult.rows[0].id;

    // 2. Delete all cart items for this cart
    await pool.query(
      "DELETE FROM cart_items WHERE cart_id = $1",
      [cartId]
    );

    // 3. Commit transaction
    await pool.query("COMMIT");

    // 4. Return empty cart
    const cart = cartResult.rows[0];
    return res.status(200).json({ 
      cart, 
      items: [], 
      meta: { totalItems: 0, subtotal: 0 },
      message: "Cart cleared successfully"
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Clear user cart error:", err.message);
    return res.status(500).json({ message: "Error clearing cart" });
  }
};

// Helper: fetch a cart and its items with computed meta
async function getCartWithItems(cartId) {
  const cartRes = await pool.query(
    "SELECT id, user_id, status, created_at FROM cart WHERE id=$1",
    [cartId]
  );
  const cart = cartRes.rows[0] || null;

  const itemsRes = await pool.query(
    `SELECT ci.id AS cart_item_id, ci.quantity, ci.added_at,
            ci.size, ci.color_hex,
            p.id AS product_id, p.name, p.description, p.price, p.image_url, p.stock, p.category_id
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.added_at DESC`,
    [cartId]
  );
  const items = itemsRes.rows;

  let totalItems = 0;
  let subtotal = 0;
  for (const it of items) {
    totalItems += Number(it.quantity);
    subtotal += Number(it.quantity) * Number(it.price);
  }
  subtotal = Number(subtotal.toFixed(2));

  return { cart, items, meta: { totalItems, subtotal } };
}

export const deleteCartItem = async (req, res) => {
  const userId = req.user.id;
  const cartItemId = parseInt(req.params.id, 10);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({ message: "Invalid cart item ID" });
  }

  try {
    // Start transaction
    await pool.query("BEGIN");

    // 1. Verify the cart item belongs to the user's ACTIVE cart
    const itemResult = await pool.query(
      `SELECT ci.id, c.user_id, c.status AS cart_status, c.id AS cart_id
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [cartItemId]
    );
    if (itemResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Cart item not found" });
    }
    const item = itemResult.rows[0];
    if (item.user_id !== userId) {
      await pool.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden: cart item does not belong to user" });
    }
    if (item.cart_status !== "ACTIVE") {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Cannot modify items on a non-ACTIVE cart" });
    }

    // 2. Delete cart item
    await pool.query(`DELETE FROM cart_items WHERE id = $1`, [cartItemId]);

    // 4. Commit transaction
    await pool.query("COMMIT");

    // 5. Return updated cart
    const updatedCartData = await getCartWithItems(item.cart_id);
    res.status(200).json(updatedCartData);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Server error while deleting cart item" });
  }
};

export const revertCheckoutCart = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id, 10);
    if (!userId || userId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const inProgressRes = await pool.query(
      "SELECT id FROM cart WHERE user_id=$1 AND status='CHECKOUT_IN_PROGRESS' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (inProgressRes.rows.length === 0) {
      return res.status(404).json({ message: "No cart in checkout in progress" });
    }
    const cartId = inProgressRes.rows[0].id;
    const updRes = await pool.query(
      "UPDATE cart SET status='ACTIVE' WHERE id=$1 RETURNING id, user_id, status, created_at",
      [cartId]
    );
    const updated = updRes.rows[0];
    const data = await getCartWithItems(updated.id);
    return res.status(200).json({ ...data, message: "Checkout cancelled" });
  } catch (err) {
    console.error("Revert checkout error:", err.message);
    return res.status(500).json({ message: "Error reverting checkout" });
  }
};
