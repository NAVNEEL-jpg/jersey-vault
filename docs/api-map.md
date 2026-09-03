# API Endpoints Map

This document lists all active Express.js endpoints configured in `server.js`.

## Users (`/api/users`)
*All user routes are protected by the `protect` middleware.*
- `POST /api/users/save` – Save or sync user profile data.
- `GET /api/users/profile/:id` – Retrieve a user's profile.
- `PUT /api/users/profile/:id` – Update a user's profile.
- `POST /api/users/wishlist` – Add a product to the user's wishlist.
- `DELETE /api/users/wishlist/:productId` – Remove a product from the wishlist.

## Orders (`/api/orders`)
- `POST /api/orders` – Create a new order.
- `GET /api/orders/track/:trackingId` – Public tracking endpoint.
- `GET /api/orders/user/:id` – List orders for a specific user (protected).
- `GET /api/orders` – List all orders (protected, admin only).
- `PUT /api/orders/:id/status` – Update the status of an order (protected, admin only).
- `GET /api/orders/:id/invoice` – Generate/download invoice.

## Products (`/api/products`)
- `GET /api/products` – List all products (public).
- `GET /api/products/:id` – Get product details (public).
- `POST /api/products` – Create a new product (protected, admin only).
- `PUT /api/products/:id` – Update a product (protected, admin only).
- `DELETE /api/products/:id` – Delete a product (protected, admin only).

### Reviews (`/api/products/reviews`)
- `GET /api/products/reviews/all` – List all reviews.
- `GET /api/products/reviews/:productId` – Get reviews for a specific product.
- `POST /api/products/reviews` – Add a new review.
- `PUT /api/products/reviews/toggle` – Toggle review visibility.
- `PUT /api/products/reviews` – Update a review.
- `DELETE /api/products/reviews/:productId/:reviewId` – Delete a review.

## Payments (`/api/payment`)
- `POST /api/payment/create-order` – Create a Razorpay order.
- `POST /api/payment/verify` – Verify Razorpay signature and finalize the order.
- `POST /api/payment/webhook` – Razorpay server-to-server webhook.
- `GET /api/payment/status/:razorpayOrderId` – Poll the status of a payment.
- `GET /api/payment/reconcile/:query` – Reconcile payments (protected, admin only).

## Shipping (`/api/shipping`)
*All shipping routes are public.*
- `POST /api/shipping/calculate` – Calculate shipping cost based on zone.
- `POST /api/shipping/live-rate` – Fetch live shipping rate.
- `GET /api/shipping/pincode/:pincode` – Check serviceability of a pincode.

## Support (`/api/support`)
- `POST /api/support/chat` – Handle customer support chat requests.

## Uploads (`/api/upload`)
- `POST /api/upload` – Upload a single image (protected).

## Admin (`/api/admin`)
*All admin routes use both `protect` and `adminOnly` middlewares.*
- `GET /api/admin/stats` – Get system statistics.
- `GET /api/admin/users` – List all registered users.
- `DELETE /api/admin/users/:id` – Delete a user.
- `GET /api/admin/orders/:id/invoice` – Generate invoice for admin.
- `GET /api/admin/settings` – Retrieve site settings.
- `PUT /api/admin/settings` – Update site settings.

## Database & Cloudflare Query API (`/api/db`)
*Direct query interface mirroring Supabase syntax to interact with Cloudflare R2 tables and media storage.*
- `GET /api/db/:table` – Query table records with filters (`eq`, `neq`, `in`, `ilike`), ordering (`order`), field selection (`select`), and limits (`limit`).
- `POST /api/db/:table` – Insert record into table.
- `PATCH /api/db/:table` or `PUT /api/db/:table` – Update record in table.
- `DELETE /api/db/:table` – Delete record from table.
- `POST /api/db/storage/:bucket/upload` – Upload file to Cloudflare R2 bucket.

## Other
- `GET /api/test` – Health check endpoint to verify API is running.

---
*Note: Authentication relies entirely on Supabase Auth. There are no Express `/api/auth` routes.*
*Generated on 2026-07-30*
