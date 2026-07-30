# Route Map (Express)

The server groups routes by feature. All routes are mounted under `/api` inside `server.js`.

| File | Base Path | Middleware | Endpoints |
|------|-----------|------------|-----------|
| **adminRoutes.js** | `/api/admin` | `protect`, `adminOnly` | `GET /stats`, `GET /users`, `DELETE /users/:id`, `GET /orders/:id/invoice`, `GET /settings`, `PUT /settings` |
| **orderRoutes.js** | `/api/orders` | `protect` (except public track) | `POST /` (create), `GET /track/:trackingId`, `GET /user/:id`, `GET /` (admin), `PUT /:id/status` (admin), `GET /:id/invoice` |
| **productRoutes.js** | `/api/products` | `protect`/`adminOnly` for mutating ops | `GET /` (list), `GET /:id`, `POST /` (admin), `PUT /:id` (admin), `DELETE /:id` (admin), review sub‑routes (`/reviews/*`) |
| **paymentRoutes.js** | `/api/payment` | `protect`, `adminOnly` for reconcile | `POST /create-order`, `POST /verify`, `POST /cod`, `GET /status/:razorpayOrderId`, `POST /webhook`, `GET /reconcile/:query` (admin) |
| **shippingRoutes.js** | `/api/shipping` | none (public) | `POST /calculate`, `POST /live-rate`, `GET /pincode/:pincode` |
| **supportRoutes.js** | `/api/support` | none (public) | `POST /chat` |
| **uploadRoutes.js** | `/api/upload` | `protect` | `POST /` (single image upload via Multer) |
| **userRoutes.js** | `/api/users` | `protect` | `POST /save`, `GET /profile/:id`, `PUT /profile/:id`, `POST /wishlist`, `DELETE /wishlist/:productId` |

All route modules export an Express Router. Admin-only routes strictly enforce `adminOnly` which requires the token's role to be `admin`.

*Generated on 2026-07-30*
