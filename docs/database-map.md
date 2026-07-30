# Database Map (Supabase)

The application uses Supabase as the single source of truth. Below is a concise map of the tables that are accessed directly by the codebase.

| Table | Primary Key | Important Columns | Relationships / Usage |
|-------|-------------|-------------------|-----------------------|
| **users** (via Supabase Auth) | `id` (UUID) | `email`, `app_metadata.role`, `user_metadata` | Auth token validation (`protect` middleware). |
| **profiles** | `id` (UUID, FK → users.id) | `name`, `email`, `phone`, `address`, `city`, `state`, `pincode`, `role` | Loaded in `protect` to enrich `req.user`. |
| **orders** | `id` (UUID) | `customer_name`, `customer_email`, `customer_phone`, `address`, `city`, `state`, `pincode`, `items` (JSON), `subtotal`, `shipping`, `total`, `pay_method`, `status` (`pending`, `confirmed`, `inventory_pending`), `admin_notes`, `razorpay_order_id`, `razorpay_payment_id`, `payment_captured`, `created_at` | Created in `orderController` & `paymentController` (pending → confirmed/inventory_pending). Acts as the single source of truth for financials. |
| **products** | `id` (UUID) | `name`, `price`, `size_stock` (JSON), `category`, `description`, `image_url`, `rating`, `reviews_count`, `is_26_27` | Read for product listings. Stock mutated via atomic `update_size_stock` RPC to prevent lost updates. |
| **reviews** | `id` (UUID) | `product_id` (FK → products.id), `user_id` (FK → users.id), `rating`, `comment`, `visible` | Accessed via product review routes. |
| **wishlists** | composite PK (`user_id`, `product_id`) | `added_at` | Managed through user wishlist endpoints. |
| **settings** | single row (`id = 1`) | `site_name`, `logo_url`, `currency`, `shipping_rules` (JSON) | Admin settings read/write. |
| **payments** (implicit) | – | Stored within `orders` (`razorpay_*` fields) | Razorpay order creation & verification. |

### Notes
- **Soft deletes** are not used; records are removed with `DELETE` calls (e.g., products, reviews, users).
- **RLS (Row‑Level Security)** is assumed to be configured in Supabase to respect the `role` field of `app_metadata`.
- **JSON columns** (`items`, `size_stock`, `shipping_rules`) store structured data required by the business logic.
- **Timestamps** (`created_at`, `updated_at`) are automatically managed by Supabase.

*Generated on 2026-07-30*
