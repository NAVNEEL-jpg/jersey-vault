# JERSEY VAULT - PROJECT MEMORY

## 1. Project Overview
**Jersey Vault** is a full-stack e-commerce application specializing in the sale of football jerseys. It supports guest checkouts, authenticated user order tracking, secure payment gateways, and a comprehensive admin panel for inventory and order management.

## 2. Business Purpose
- **Goal**: To provide a seamless, premium, neon-themed storefront for football enthusiasts to purchase replica and authentic jerseys.
- **Users**: Customers (guest or authenticated) buying jerseys, and Administrators managing inventory/orders.
- **Core Workflow**: Browse jerseys → Add to Cart → Proceed to Checkout → Enter shipping details → Pay securely via Razorpay → Track order status.

## 3. Tech Stack
- **Frontend**: React.js (Create React App), React Router, Context API, CSS (Neon theme).
- **Backend**: Node.js, Express.js.
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth via OTP, Supabase Storage).
- **Payments**: Razorpay (Integration via `window.Razorpay` on frontend, server-side signature verification).
- **Telemetry**: Google Analytics 4, Microsoft Clarity, Cloudflare Web Analytics.
- **Deployment**: Vercel (Frontend), Render (Backend), Cloudflare (DNS/Security/CSP).

## 4. Repository Structure
```text
jersey-vault/
├── client/                 # Frontend React Application
│   ├── public/             # Static assets (index.html, manifest.json)
│   ├── src/
│   │   ├── components/     # Reusable UI components (Cart, Navbar, Footer)
│   │   ├── config/         # Environment variables mapping
│   │   ├── context/        # React Context (AuthContext, CartContext)
│   │   ├── pages/          # React Router page views (Home, Checkout, AdminPage)
│   │   ├── supabase.js     # Supabase client initialization
│   │   └── razorpay.js     # Payment integration config
│   └── package.json
└── server/                 # Backend Express API
    ├── src/
    │   ├── config/         # Supabase service role initialization
    │   ├── controllers/    # Business logic (paymentController, adminController)
    │   └── routes/         # Express routing definitions
    ├── index.js            # Server entry point & Middleware
    └── package.json
```

## 5. System Architecture
See `architecture.md` for the full visual map. The application uses a decoupled frontend-backend architecture. The React frontend interacts with Supabase directly for authentication and reading public data, but relies on the Express backend for secure operations: creating orders, verifying payments, sending emails, and admin operations.

## 6. Frontend Architecture
- **State Management**:
  - `CartContext`: Manages items added to cart, calculates totals, and persists to `localStorage`.
  - `AuthContext`: Listens to `supabase.auth.onAuthStateChange`, fetches the user's `profile` row to check `is_admin`, and provides session data globally.
- **Routing**: Client-side routing via `react-router-dom`.

## 7. Backend Architecture
- **Controllers**: Thin controllers that execute business logic.
- **Security**: The backend bypasses Row Level Security (RLS) using the Supabase Service Role Key. This ensures the frontend cannot spoof prices or order statuses.
- **Payment & Inventory Atomicity**: `paymentController.verifyPayment` securely calculates the HMAC-SHA256 signature using the `RAZORPAY_KEY_SECRET`. Upon verification, the `orders` table acts as the Single Source of Truth for financials. Inventory is mutated via a PostgreSQL RPC (`update_size_stock`) which guarantees atomicity through `FOR UPDATE` row locks, preventing race conditions and lost updates.

## 8. Data Flow Diagrams
**Checkout Flow**:
1. User clicks "Pay" on `Checkout.jsx`.
2. Frontend sends cart payload to `POST /api/payment/create-order`.
3. Backend validates prices against the database, creates a Razorpay Order ID, and returns it.
4. Frontend invokes `window.Razorpay` with the Order ID.
5. User completes payment in the modal.
6. Razorpay returns `payment_id` and `signature` to the frontend.
7. Frontend sends these to `POST /api/payment/verify`.
8. Backend verifies the signature and records the `order` and `order_items` in Supabase.
9. Backend attempts an atomic stock decrement via `update_size_stock` RPC.
10. If stock is successfully reserved, the order is marked `confirmed`. If a conflict occurs, it is marked `inventory_pending` with an explanatory `admin_notes` to preserve the payment without promising shipment.
11. Admin notifications are pushed via a reference-counted Supabase Realtime singleton.
12. Frontend clears the cart and redirects to `/success`.

## 9. Environment Variables
**Frontend (`client/.env`)**:
- `REACT_APP_SUPABASE_URL`: Public Supabase URL.
- `REACT_APP_SUPABASE_KEY`: Public Supabase Anon Key.
- `REACT_APP_RAZORPAY_KEY_ID`: Public Razorpay Key ID (Live).
- `REACT_APP_API_URL`: Backend URL (e.g., `https://jersey-vault-backend.onrender.com`).

**Backend (`server/.env`)**:
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY`: Secure backend database access.
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Secure payment processing.
- `RESEND_API_KEY`: Email delivery.
- `FRONTEND_URL`: CORS configuration.

## 10. Technical Debt & Performance Notes
- **Images**: Previously relied heavily on external image hosts (e.g., bing). Images are currently being migrated to Supabase Storage to prevent Mixed Content and adhere to strict CSP.
- **CSP Deployment**: Cloudflare Transform Rules aggressively block unauthorized scripts. The `connect-src` must explicitly allow the Render backend and Supabase URLs.
- **Accessibility**: Several inputs in `Checkout.jsx` and `AdminPage.jsx` lack `name` attributes or duplicate `id`s, which causes minor browser warnings.

## 11. Known Risks & Future Recommendations
- **Database Triggers**: The `profiles` table relies on an `on_auth_user_created` trigger. If this fails, users will not have a profile row and will fail authentication checks.
- **Admin Security**: Admin checks are currently based on `is_admin` in the `profiles` table. Ensure RLS policies in Supabase prevent regular users from updating this boolean field.
- **Recommendations**: Continue the image migration to Supabase Storage. Implement automated E2E tests for the Razorpay checkout flow in a staging environment before pushing backend changes.
