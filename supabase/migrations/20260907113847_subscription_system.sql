-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Extend profiles table with new fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'grade') THEN
        ALTER TABLE profiles ADD COLUMN grade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
        ALTER TABLE profiles ADD COLUMN age INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'pending'));
    END IF;
END $$;

-- 2. Create plan_tiers table for dynamic plan management
CREATE TABLE IF NOT EXISTS public.plan_tiers (
    tier TEXT PRIMARY KEY, -- 'free', 'pro'
    title TEXT NOT NULL,
    subtitle TEXT,
    price_label TEXT,
    daily_ai_limit INTEGER DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create feature_flags table for granular access control
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    min_tier TEXT DEFAULT 'free',
    position INTEGER DEFAULT 0
);

-- 4. Create pro_requests table to track subscription applications
CREATE TABLE IF NOT EXISTS public.pro_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT,
    display_name TEXT,
    grade TEXT,
    age INTEGER,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert Default Seed Data
INSERT INTO public.plan_tiers (tier, title, subtitle, price_label, daily_ai_limit, features)
VALUES 
('free', 'الخطة المجانية', 'للبداية واستكشاف المنصة', '$0', 5, '[{"label": "المساعد الذكي (٥ أسئلة)", "included": true}, {"label": "المكتبة العامة", "included": true}]'::jsonb),
('pro', 'منارة بلس', 'التجربة الكاملة للنجاح', '$1', -1, '[{"label": "مساعد ذكي غير محدود", "included": true}, {"label": "لوح ذكي احترافي", "included": true}]'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- 6. RLS Policies
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plan tiers are viewable by everyone" ON public.plan_tiers FOR SELECT USING (true);
CREATE POLICY "Only admins can manage plan tiers" ON public.plan_tiers FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.profiles WHERE role = 'superadmin'));

CREATE POLICY "Flags are viewable by everyone" ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Users can view their own requests" ON public.pro_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own requests" ON public.pro_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can view/manage all requests" ON public.pro_requests FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.profiles WHERE role = 'superadmin'));

-- 7. RPC function to handle approval/rejection
CREATE OR REPLACE FUNCTION public.decide_pro_request(_id UUID, _approve BOOLEAN)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Security check: only superadmins (adjust condition as per your role system)
    -- For now, let's assume the calling context is validated or use a simple check
    
    SELECT user_id INTO v_user_id FROM public.pro_requests WHERE id = _id;
    
    IF _approve THEN
        UPDATE public.pro_requests SET status = 'approved' WHERE id = _id;
        UPDATE public.profiles SET plan = 'pro', plan_started_at = NOW() WHERE id = v_user_id;
    ELSE
        UPDATE public.pro_requests SET status = 'rejected' WHERE id = _id;
        UPDATE public.profiles SET plan = 'free' WHERE id = v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;