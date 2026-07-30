# Architecture Overview

## High‑Level Components

- **Client (React)** – Source under `client/src/`. Uses React Router, React Query (planned), and `react-hot-toast` for notifications. Entry point: `client/src/App.js` (includes `<Toaster/>`).
- **Server (Express)** – Source under `server/src/`. Exposes REST APIs under `/api/`. Middleware `protect` validates Supabase JWTs; `adminOnly` restricts admin routes.
- **Supabase** – Primary PostgreSQL store and auth provider. Interacted with via `supabase-js` (`src/config/supabase.js`).
- **Razorpay Integration** – Two‑step order creation: pending order saved in DB before invoking Razorpay; verification updates the order status.
- **Background Workers** – Supabase Edge Function `smooth‑worker` runs after order finalisation (emails/SMS). 

## Data Flow
1. UI triggers API calls (e.g., order creation, product management).
2. `protect` middleware validates the JWT and attaches `req.user`.
3. Controllers perform business logic and interact with Supabase tables.
4. Payment flow creates a pending order, Razorpay processes payment, `verify` endpoint finalises the order.
5. Post‑processing utilizes an atomic PostgreSQL RPC (`update_size_stock`) to deduct inventory and prevent race conditions.
6. If an inventory conflict occurs during payment verification, the order is safely persisted as `inventory_pending` and flagged with `admin_notes` to prevent silent failures.
7. Real-time admin notifications are broadcasted via Supabase Realtime (managed by a reference-counted singleton to prevent React StrictMode collisions) and the `smooth-worker` sends emails/SMS.

## Key Decisions (unchanged)
- Shipping zones, COD fees, pricing logic remain in `orderController.js`.
- UI styling, colors, layout, and branding are untouched.
- No changes to environment variables, deployment scripts, or Supabase migrations.

---
*Generated on 2026‑07‑30*
