# Database Map (Hybrid: Supabase & Cloudflare R2)

The application utilizes a distributed data architecture: **Supabase** handles User Authentication and Financial Orders, while **Cloudflare R2** hosts the entire Product Catalog, Teams, Site Settings, Reviews, and Media Assets.

## 1. Supabase (Auth & Orders)

| Table | Primary Key | Important Columns | Relationships / Usage |
|-------|-------------|-------------------|-----------------------|
| **users** (via Supabase Auth) | `id` (UUID) | `email`, `app_metadata.role`, `user_metadata` | Auth token validation & customer signup/login. |
| **profiles** | `id` (UUID, FK → users.id) | `name`, `full_name`, `email`, `phone`, `address`, `role`, `wishlist` | Loaded in `protect` middleware to enrich `req.user`. |
| **orders** | `id` (UUID) | `customer_name`, `customer_email`, `customer_phone`, `address`, `city`, `state`, `pincode`, `items` (JSON), `subtotal`, `shipping`, `total`, `pay_method`, `status` (`pending`, `confirmed`, `inventory_pending`, `shipped`, `delivered`, `cancelled`), `admin_notes`, `razorpay_order_id`, `razorpay_payment_id`, `payment_captured`, `created_at` | Order lifecycle and payment reconciliations. Acts as the single source of truth for financials. |

## 2. Cloudflare R2 (Catalog & Content)

Data is persisted in the Cloudflare R2 bucket `jersey-vault-media` under `db/*.json` with in-memory caching and local server backups in `server/src/data/`.

| Entity / Table | Key Identifier | Important Attributes | Storage & Endpoints |
|----------------|----------------|----------------------|---------------------|
| **products** | `id` (UUID / text) | `name`, `price`, `size_stock` (JSON), `stock`, `status`, `type`, `team_id`, `image_url`, `images` (Array), `featured`, `is_26_27`, `is_clearance`, `description`, `teams` (Object) | `db/products.json`<br>API: `/api/products` & `/api/catalog/all` |
| **teams** | `id` (UUID / text) | `name`, `sport`, `logo_url`, `created_at` | `db/teams.json`<br>API: `/api/catalog/teams` |
| **site_settings** | `key` (string) | `value` (string / JSON serialized) | `db/site_settings.json`<br>API: `/api/catalog/settings` & `/api/admin/settings` |
| **reviews** | `id` (string) | `product_id`, `reviewer_name`, `rating`, `comment`, `photos` (Array), `is_published`, `created_at` | Embedded inside `site_settings` under key `jersey_reviews_v1_{productId}`<br>API: `/api/products/reviews` |
| **categories** | `id` (string) | `name`, `slug`, `icon` | `db/categories.json`<br>API: `/api/catalog/all` |
| **media / uploads** | file key | Cloudflare R2 Public CDN URL (`R2_PUBLIC_URL`) | Buckets: `products/`, `team-logos/`, `reviews/`<br>API: `/api/upload` |

---
*Updated on 2026-09-03*
