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
    servers: [
      {
        url: `http://localhost:${PORT}`, // <- dynamic port
      },
    ],
  },
  apis: ["./routes/*.js"], // path to route files with Swagger comments
};

const swaggerSpecs = swaggerJSDoc(options);

export default swaggerSpecs;
