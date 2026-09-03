# Architecture Overview

## High‑Level Components

- **Client (React)** – Source under `client/src/`. Uses React Router and `react-hot-toast` for notifications. Consumes products, teams, reviews, and settings via the Express REST API (backed by Cloudflare R2), and authentication/orders via Supabase.
- **Server (Express)** – Source under `server/src/`. Exposes REST APIs under `/api/`. Middleware `protect` validates Supabase JWTs; `adminOnly` restricts admin routes.
- **Cloudflare R2** – Stores product catalog, teams, categories, site settings, reviews, and all media/image uploads. Accessed via `@aws-sdk/client-s3` in `server/src/services/r2Service.js` with in-memory caching and local filesystem fallback (`server/src/data/`).
- **Supabase** – Dedicated Authentication & Order Management engine:
  - `auth.users` & `public.profiles` for customer and admin auth.
  - `public.orders` for order tracking, payment confirmation, and status lifecycles.
- **Razorpay Integration** – Two‑step order creation and verification against Supabase `orders` with pricing re-verification against Cloudflare R2 products.
- **Delhivery Logistics** – Dynamic rate calculation and shipment tracking for orders.

## Data Flow
1. **Catalog & Browsing**: The React client queries `/api/catalog/all`, `/api/products`, and `/api/catalog/teams` directly backed by Cloudflare R2.
2. **Authentication**: Client performs sign up, sign in, OTP, and session management using Supabase Auth, validating user roles via `profiles`.
3. **Cart & Payment**: `recalculateCart` verifies current product pricing against Cloudflare R2. Razorpay payment verification updates order status in Supabase `orders`.
4. **Inventory**: Stock checks and deductions occur in Cloudflare R2 (`products.json`) upon order placement; cancelled orders restore stock.
5. **Media Storage**: Product and team images upload directly to Cloudflare R2 via `/api/upload` and serve through the public CDN URL (`R2_PUBLIC_URL`).

---
*Updated on 2026-09-03*
