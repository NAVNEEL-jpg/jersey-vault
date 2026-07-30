# DEPENDENCY GRAPH

## Critical Core Files (Do Not Modify Lightly)
1. `client/src/supabase.js`
   - **Role**: Initializes Supabase client. All DB/Auth calls rely on this.
2. `server/src/config/supabase.js`
   - **Role**: Initializes Supabase Service Role client for backend operations.
3. `client/src/razorpay.js`
   - **Role**: Centralized Razorpay initialization and environment configuration.
4. `server/src/controllers/paymentController.js`
   - **Role**: Handles Razorpay Signature verification and secure Order creation.

## Application State Flow
`client/src/index.js`
 └── `client/src/App.js` (Routes, Layout)
      ├── `CartContext` (Global Cart State)
      ├── `AuthContext` (User Session & Role State)
      └── `HelmetProvider` (SEO/CSP handling)

## Frontend Dependency Chain (Checkout Flow)
`Checkout.jsx`
 ├── Reads from `CartContext`
 ├── Fetches `api/payment/create-order`
 ├── Loads `https://checkout.razorpay.com/v1/checkout.js`
 ├── Displays Razorpay Modal
 └── Posts to `api/payment/verify`
      └── Navigates to `Success.jsx`

## Backend Dependency Chain (Express Server)
`server/index.js` (App Entry, Middleware, CORS setup)
 ├── `server/src/routes/productRoutes.js` 
 │    └── `server/src/controllers/productController.js` (Uses `supabase.js`)
 ├── `server/src/routes/paymentRoutes.js`
 │    └── `server/src/controllers/paymentController.js` (Uses `razorpay` SDK)
 └── `server/src/routes/adminRoutes.js`
      └── `server/src/controllers/adminController.js` (Uses `supabase.js` Service Role)

## Third-Party High-Impact Packages
- `react-router-dom`: SPA Routing
- `@supabase/supabase-js`: Backend-as-a-Service, Auth, Database
- `razorpay`: Payment Gateway (Backend SDK)
- `react-helmet-async`: Head metadata injection (SEO and Security headers)
- `framer-motion`: Page animations and micro-interactions
- `react-ga4`: Google Analytics 4 tracking
