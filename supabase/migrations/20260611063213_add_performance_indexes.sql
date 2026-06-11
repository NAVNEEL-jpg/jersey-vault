CREATE INDEX IF NOT EXISTS idx_orders_tracking_id
ON public.orders (tracking_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
ON public.orders (customer_email);

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
ON public.orders (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_products_status
ON public.products (status);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
ON public.profiles
USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
ON public.profiles
USING GIN (full_name gin_trgm_ops);
