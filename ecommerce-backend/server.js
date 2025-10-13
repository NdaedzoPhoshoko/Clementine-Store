import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./docs/swagger.js";

import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/users", userRoutes);

// Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Base route
app.get("/", (req, res) => {
  res.send("🛍️ E-commerce API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} | view endpoints here http://localhost:${PORT}/api/docs`));
