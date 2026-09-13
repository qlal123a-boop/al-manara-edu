-- 1. Update profiles table to support plan status and expiry
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expiry timestamptz DEFAULT NULL;

-- 2. Create subscription_requests table
CREATE TABLE IF NOT EXISTS public.pro_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    display_name text,
    grade text,
    age integer,
    duration_months integer DEFAULT 1,
    total_price numeric DEFAULT 3,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    note text,
    created_at timestamptz DEFAULT now()
);

-- 3. Create plan_tiers table for dynamic pricing and features
CREATE TABLE IF NOT EXISTS public.plan_tiers (
    tier text PRIMARY KEY, -- 'free', 'pro'
    title text NOT NULL,
    subtitle text,
    price_label text, -- e.g. '3 شيكل / شهر'
    daily_ai_limit integer DEFAULT 5,
    features jsonb DEFAULT '[]'::jsonb,
    limits jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key text PRIMARY KEY,
    label text NOT NULL,
    enabled boolean DEFAULT true,
    min_tier text DEFAULT 'free',
    position integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.pro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies: pro_requests
CREATE POLICY "Users can view their own requests" ON public.pro_requests 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests" ON public.pro_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests" ON public.pro_requests 
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies: plan_tiers & feature_flags (Public read, Admin write)
CREATE POLICY "Anyone can read tiers" ON public.plan_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage tiers" ON public.plan_tiers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can manage flags" ON public.feature_flags FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. RPC Function to decide on request and update profile
CREATE OR REPLACE FUNCTION public.decide_pro_request(_id uuid, _approve boolean)
RETURNS void AS $$
DECLARE
    req_user_id uuid;
    months_to_add integer;
BEGIN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'غير مصرح لك بالقيام بهذا الإجراء.';
    END IF;

    SELECT user_id, duration_months INTO req_user_id, months_to_add FROM pro_requests WHERE id = _id;

    IF _approve THEN
        UPDATE pro_requests SET status = 'approved' WHERE id = _id;
        UPDATE profiles 
        SET 
            plan_type = 'pro',
            subscription_expiry = COALESCE(subscription_expiry, now()) + (months_to_add || ' month')::interval
        WHERE id = req_user_id;
    ELSE
        UPDATE pro_requests SET status = 'rejected' WHERE id = _id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;