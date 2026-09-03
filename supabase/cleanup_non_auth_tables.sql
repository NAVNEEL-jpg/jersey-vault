-- ==============================================================================
-- JERSEY VAULT - SUPABASE DATABASE CLEANUP SCRIPT
-- ==============================================================================
-- This script removes all non-auth and non-order tables from Supabase, as these
-- are now fully managed by Cloudflare R2 and the dedicated backend REST API:
--
--  MIGRATED TO CLOUDFLARE R2:
--   - public.products
--   - public.teams
--   - public.site_settings
--   - public.categories
--   - public.subcategories
--   - public.reviews
--   - public.wishlists
--   - Supabase storage buckets ('Jersey image', 'team-logos')
--
--  KEPT ON SUPABASE:
--   - auth.users (Supabase Authentication & Login)
--   - public.profiles (User profile credentials, roles, address)
--   - public.orders (Order & Payment management)
--   - auth triggers (handle_new_user)
-- ==============================================================================

BEGIN;

-- 1. Drop foreign key constraints referencing products/teams if any exist
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- 2. Drop RLS policies for migrated tables
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;

-- 3. Drop non-auth and non-order tables
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;

-- 4. Drop non-auth RPC functions if any
DROP FUNCTION IF EXISTS public.decrement_stock(uuid, integer);
DROP FUNCTION IF EXISTS public.update_size_stock(text, text, integer);

-- 5. Verification queries to confirm only auth and orders remain intact
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

COMMIT;

-- Expected remaining public tables:
-- 1. orders
-- 2. profiles
