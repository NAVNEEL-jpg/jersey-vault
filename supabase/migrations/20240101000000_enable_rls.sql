-- Enable RLS on all critical tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products. No one can mutate via client.
CREATE POLICY "Public can view active products" ON public.products
FOR SELECT USING (status = 'active');

-- Teams: Everyone can read. No one can mutate via client.
CREATE POLICY "Public can view teams" ON public.teams
FOR SELECT USING (true);

-- Profiles: Users can read and update their own profiles.
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders: Users can read their own orders. Insert/Update are handled by Service Role (backend).
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = customer_id);

-- Note: Admin actions are bypassed using Service Role Key on the backend.
