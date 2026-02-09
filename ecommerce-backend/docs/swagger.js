import swaggerJSDoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "API documentation for the E-commerce backend",
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication: login, refresh, logout, forgot/reset/change password via OTP",
      },
      {
        name: "User Profile & Setting",
        description: "User profiles and settings endpoints",
      },
      {
        name: "Products & Categories",
        description: "Product catalog: list, get, create, update, delete",
      },
      {
        name: "Payments",
        description: "Payment methods and saved cards",
      },
      {
        name: "Home Features",
        description: "Homepage insights: trendy, new arrival, featured collection, top rated, low stock",
      },
      {
        name: "Checkouts & Orders",
        description: "Checkout flow and order management",
      },
      {
        name: "Admin",
        description: "Admin operations: inventory logs and moderation",
      },
      {
        name: "Reviews",
        description: "Product reviews and ratings",
      },
    ],
    servers: [
      {
        url: `https://clementine-store-backend.onrender.com`, // <- backend hosted port
      },
    ],
  },
  apis: ["./routes/*.js"], // remove server.js to keep docs centralized in routes
};

const swaggerSpecs = swaggerJSDoc(options);

export default swaggerSpecs;
