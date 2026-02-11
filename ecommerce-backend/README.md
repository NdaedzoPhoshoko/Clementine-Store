# Clementine Store — E‑commerce Backend

A production‑ready Node.js/Express backend for an e‑commerce application. It provides a secure JWT‑based authentication system, admin‑gated operations, a PostgreSQL data layer, and comprehensive API documentation via Swagger.

## Overview

- Technology: `Node.js` (ES Modules), `Express`, `PostgreSQL` (`pg` pool), `JWT`, `Swagger UI`
- Documentation: `http://localhost:<PORT>/api/docs`
- Auth: Access token in `Authorization: Bearer <token>`, httpOnly refresh token cookie
- Admin: Checked via `ADMIN_USER_IDS` and/or `ADMIN_EMAILS` environment variables
- Database: Supabase‑hosted Postgres (or any Postgres compatible instance)

## Architecture

- Server entry: `server.js`
  - Loads environment, sets up middleware (`cors`, `cookie-parser`, JSON body), mounts routes, and serves Swagger docs.
- Data access: `config/db.js`
  - Single `pg.Pool` with `connectionString` from `DATABASE_URL` and `ssl` enabled for hosted Postgres.
- Middleware: `middleware/auth.js`
  - `protect`: validates JWT access tokens.
  - `requireAdmin`: grants admin based on env IDs/emails, without changing DB schema.
  - `requireSelfOrAdmin`: allows resource access to the owner or admin.
- Documentation: `docs/swagger.js`
  - OpenAPI 3.0 with `bearerAuth` security scheme; routes are annotated inline.

## Packages

The backend relies on the following packages (install via `npm install`):

- Production / runtime:
  - `express`, `pg`, `dotenv`, `cors`, `swagger-ui-express`, `swagger-jsdoc`, `jsonwebtoken`, `bcryptjs`, `cloudinary`, `multer`, `stripe`
- Development / tooling:
  - `nodemon` (dev)

See `backendsetup.txt` for the exact install commands used during development.

## Project Structure

Top-level layout for the `ecommerce-backend` folder:

```
ecommerce-backend/
|-- package.json
|-- README.md
|-- server.js
|-- todo.txt
|-- config/
|   |-- cloudinary.js
|   `-- db.js
|-- controllers/
|   |-- authController.js
|   |-- cartController.js
|   |-- categoryController.js
|   |-- inventoryController.js
|   |-- orderController.js
|   |-- paymentCardController.js
|   |-- paymentController.js
|   |-- productController.js
|   |-- reviewController.js
|   |-- shippingController.js
|   |-- userController.js
|   `-- home_features/
|       `-- homeFeaturesController.js
|-- docs/
|   |-- indexes.sql
|   `-- swagger.js
|-- middleware/
|   `-- auth.js
|-- models/
|   `-- userModel.js
|-- routes/
|   |-- authRoutes.js
|   |-- cardRoutes.js
|   |-- cartItemRoutes.js
|   |-- cartRoutes.js
|   |-- categoryRoutes.js
|   |-- homeFeaturesRoutes.js
|   |-- inventoryRoutes.js
|   |-- orderRoutes.js
|   |-- paymentRoutes.js
|   |-- productRoutes.js
|   |-- reviewRoutes.js
|   |-- shippingRoutes.js
|   `-- userRoutes.js
`-- scripts/
  `-- fullscript.sql
```

## Key Features

- Authentication & Session
  - Register/login with hashed passwords (`bcryptjs`).
  - Issues short‑lived access tokens and httpOnly refresh tokens.
  - Refresh endpoint issues new access tokens and rotates refresh cookie.
  - Logout revokes refresh tokens via `token_version`.
  - Password management: forgot/reset via OTP, change password (requires valid access token).
- Product & Category Management
  - Product CRUD with admin‑protected creation, updates, deletion.
  - Category listing and retrieval.
  - Admin‑only endpoints:
    - Bulk add categories: `POST /api/categories/add`
    - Update category: `PUT /api/categories/{id}`
    - Delete category: `DELETE /api/categories/{id}`
- Cart, Orders, Payments, Shipping
  - Cart management and item operations scoped to the authenticated user.
  - Checkout creates orders from the active cart; returns order, items, shipping details.
  - Payments validate order ownership and enforce exact totals.
  - Shipping details upsert and list with owner checks; admins can query by user.
- Inventory Logs (Admin)
  - Paginated logs with filters; requires admin and bearer token.

## Environment Configuration

Create an `.env` file in `ecommerce-backend/` with the following variables:

```dotenv
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database (Postgres)
DATABASE_URL=postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB>

# JWT tokens
JWT_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRES_IN=30m          # optional; default 30m
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d          # optional; default 7d

# Admin configuration (choose either or both)
ADMIN_USER_IDS=1,2                 # comma‑separated user IDs
ADMIN_EMAILS=admin@example.com     # comma‑separated emails
```

Notes:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be distinct.
- `CORS_ORIGIN` should match your frontend origin.
- For Supabase session pooler, set `DATABASE_URL` to your pooler connection string.

## Database Schema

Use `fullscript.sql` to provision tables, constraints, and indexes. It defines core entities:
- `users` (auth, password hashes, token_version, OTP fields)
- `categories`, `products`, `product_images`
- `cart`, `cart_items`
- `orders`, `order_items`, `payments`
- `shipping_details`
- `inventory_log`

Run the SQL script against your Postgres database before starting the server.

## Setup & Run

1. Install dependencies:
   ```bash
   cd ecommerce-backend
   npm install
   ```
2. Configure environment: create a `.env` in `ecommerce-backend/` following the Environment Configuration section above.
3. Provision database: run `scripts/fullscript.sql` on your Postgres instance (or use your migration tooling).

Development run
 - Start server with auto-reload (recommended for development):
```bash
npm run dev
```

Production run
 - Ensure `NODE_ENV=production` and set secure, distinct secrets: `JWT_SECRET` and `JWT_REFRESH_SECRET`.
 - Recommended process manager: `pm2` (install globally `npm i -g pm2`) or use your container/orchestration platform.
 - Start production server:
```bash
# from ecommerce-backend/
NODE_ENV=production PORT=5000 pm2 start server.js --name clementine-backend --env production
```
 - When running in production behind a reverse proxy (Nginx, AWS ALB, etc.) terminate TLS at the edge and forward requests to the app. Ensure the `CORS_ORIGIN` env var matches your frontend origin.

Security & operational notes
 - Use a managed Postgres (or ensure SSL and connection pooling for hosted DBs). Set `DATABASE_URL` to your DB connection string.
 - Rotate `JWT_SECRET`/`JWT_REFRESH_SECRET` with a migration plan and invalidate old tokens if necessary.
 - Use HTTPS for cookies and set `NODE_ENV=production` so secure cookies are enforced.
 - For high availability, run multiple instances behind a load balancer and configure connection pooling for Postgres.
 - Monitor logs (stdout/stderr) and use centralized logging/alerts for production incidents.

## Authentication Flow

- Register/Login:
  - On success, response includes `accessToken` and sets an httpOnly `refreshToken` cookie.
  - Use `Authorization: Bearer <accessToken>` for protected endpoints.
- Refresh Access Token:
  - `POST /api/auth/refresh` reads the refresh cookie and returns a new `accessToken`.
- Logout:
  - `POST /api/auth/logout` increments `token_version`, invalidating existing refresh tokens; clears cookie.
- Forgot/Reset Password:
  - `POST /api/auth/forgot-password` generates a 6‑digit OTP for email delivery.
  - `POST /api/auth/reset-password` validates OTP and sets new password, revoking sessions.
- Change Password:
  - `POST /api/auth/change-password` (requires bearer token) validates old password before updating.

## Admin Authorization

- Admin checks do not require DB role changes.
- Provide admin identities via environment variables:
  - `ADMIN_USER_IDS`: numeric IDs from the `users` table.
  - `ADMIN_EMAILS`: email addresses from registered users.
- Protected admin routes are annotated in Swagger and require:
  - Valid `Authorization: Bearer <accessToken>` header, and
  - Passing admin check.

## API Surface (Selected)

Base path: `/api/*` — see Swagger for request/response models.

- Auth
  - `POST /api/auth/refresh`, `POST /api/auth/logout`
  - `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/change-password`
- Users
  - `POST /api/users/register`, `POST /api/users/login`
  - `GET /api/users/me` (bearer token)
  - `PUT /api/users/{id}` (self or admin)
- Products & Categories
  - `GET /api/products`, `GET /api/products/{id}`
  - `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` (admin)
  - `GET /api/categories`, `GET /api/categories/{id}`
  - `POST /api/categories/add` (admin bulk add)
  - `PUT /api/categories/{id}`, `DELETE /api/categories/{id}` (admin)
- Cart & Checkout
  - `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`
  - `POST /api/orders` (creates order from active cart)
- Payments & Shipping
  - `POST /api/payments` (validates amounts and ownership)
  - `POST /api/shipping`, `GET /api/shipping` (owner; admin can query by user)
- Inventory
  - `GET /api/inventory-logs` (admin)

## Error Handling & Responses

- Consistent status codes with descriptive `{ message: string }` payloads.
- Paginated list endpoints return `{ items, meta: { page, limit, total, pages, hasNext, hasPrev } }`.
- Validation errors return `400`; authorization failures return `401/403`.

## Development Notes

- ES Modules: project uses `type: "module"`; import with `import ... from ...`.
- Swagger: route files include OpenAPI comments and `bearerAuth` for protected endpoints.
- Security: httpOnly refresh cookies; access tokens only via `Authorization` header.
- CORS: configured via `CORS_ORIGIN`; adjust for your frontend.

## Deployment

- Set `NODE_ENV=production` to enable secure cookies and production CORS.
- Provide managed Postgres connection string with SSL.
- Run behind a reverse proxy (e.g., Nginx) and terminate TLS at the edge.

## Maintenance Checklist

- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` when necessary.
- Keep `ADMIN_USER_IDS`/`ADMIN_EMAILS` current.
- Monitor DB connection health and pool usage.
- Review Swagger docs when adding/modifying routes to keep them in sync.

---

For questions or improvements, open an issue or extend the route/controller modules following the existing patterns and Swagger annotations.