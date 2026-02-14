import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./docs/swagger.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import cartItemRoutes from "./routes/cartItemRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import homeFeaturesRoutes from "./routes/homeFeaturesRoutes.js";
// Removed duplicate endpoint import

dotenv.config();
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://clementine-store.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Use raw body for Stripe webhook before JSON parser
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/cart-items", cartItemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipping-details", shippingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/inventory-logs", inventoryRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/home-features", homeFeaturesRoutes);

// Removed duplicate categoriesWithImages endpoint and its Swagger block

// Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Base route
app.get("/", (req, res) => {
  res.send("🛍️ Clementine Store API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} | view endpoints here http://localhost:${PORT}/api/docs`));
