-- 1) Pro subscription requests
CREATE TABLE public.pro_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  display_name text,
  grade text,
  age integer,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_requests TO authenticated;
GRANT ALL ON public.pro_requests TO service_role;
ALTER TABLE public.pro_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pro_requests_insert_own ON public.pro_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY pro_requests_select_own_or_admin ON public.pro_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR public.is_super_admin());
CREATE POLICY pro_requests_update_admin ON public.pro_requests FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY pro_requests_delete_admin ON public.pro_requests FOR DELETE TO authenticated USING (public.is_super_admin());
CREATE TRIGGER pro_requests_set_updated_at BEFORE UPDATE ON public.pro_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Plan tiers (dynamic features & limits)
CREATE TABLE public.plan_tiers (
  tier text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  price_label text NOT NULL DEFAULT '$0',
  daily_ai_limit integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_tiers TO authenticated;
GRANT ALL ON public.plan_tiers TO service_role;
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_tiers_public_read ON public.plan_tiers FOR SELECT USING (true);
CREATE POLICY plan_tiers_admin_write ON public.plan_tiers FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE TRIGGER plan_tiers_set_updated_at BEFORE UPDATE ON public.plan_tiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plan_tiers (tier, title, subtitle, price_label, daily_ai_limit, features, limits) VALUES
('free', 'الخطة المجانية', 'للبداية واستكشاف المنصة', '$0', 5,
 '[{"label":"المساعد الذكي — ٥ أسئلة يوميًا","included":true},{"label":"المستشار الدراسي — محادثة أساسية","included":true},{"label":"اللوح الذكي — قلم وألوان أساسية","included":true},{"label":"الملخصات وأوراق العمل — عدد محدود يوميًا","included":true},{"label":"المكتبة والدروس والقنوات التعليمية","included":true},{"label":"تنزيل PDF غير محدود","included":false},{"label":"تشخيص متقدّم ومتابعة مستمرة","included":false},{"label":"اللوح الذكي Pro (ملء الشاشة والفرش المتقدمة)","included":false}]'::jsonb,
 '{"pdf_download":false,"smart_board_pro":false}'::jsonb),
('pro', 'منارة بلس', 'لكل طالب يريد التفوّق فعلًا', '$1', -1,
 '[{"label":"المساعد الذكي بلا حدود — أسئلة غير محدودة","included":true},{"label":"المستشار الدراسي الكامل: تشخيص المشكلات ومتابعة مستمرة","included":true},{"label":"اللوح الذكي Pro: ملء الشاشة، فرش متقدمة، منتقي ألوان مخصّص","included":true},{"label":"توليد ملخصات وأوراق عمل واختبارات بلا حدود","included":true},{"label":"تنزيل وطباعة PDF بلا حدود","included":true},{"label":"صور ورسوم تعليمية مولّدة تلقائيًا حسب الدرس","included":true},{"label":"أولوية في السرعة ودعم أسرع","included":true},{"label":"شهادات إتمام بتصاميم مميّزة","included":true}]'::jsonb,
 '{"pdf_download":true,"smart_board_pro":true}'::jsonb);

-- 3) Feature flags (global on/off + required tier)
CREATE TABLE public.feature_flags (
  key text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  min_tier text NOT NULL DEFAULT 'free',
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_flags_public_read ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY feature_flags_admin_write ON public.feature_flags FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE TRIGGER feature_flags_set_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feature_flags (key, label, enabled, min_tier, position) VALUES
('videos', 'قسم الفيديوهات', true, 'free', 1),
('channels', 'القنوات التعليمية', true, 'free', 2),
('courses', 'الكورسات', true, 'free', 3),
('summaries', 'الملخصات', true, 'free', 4),
('worksheets', 'أوراق العمل', true, 'free', 5),
('smart_board', 'اللوح الذكي', true, 'free', 6),
('ai_tutor', 'المساعد الذكي', true, 'free', 7),
('advisor', 'المستشار الدراسي', true, 'free', 8),
('games', 'الألعاب التعليمية', true, 'free', 9),
('library', 'المكتبة', true, 'free', 10);

-- 4) Admin AI prompt library
CREATE TABLE public.admin_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  raw_request text NOT NULL DEFAULT '',
  generated_prompt text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_prompts TO authenticated;
GRANT ALL ON public.admin_prompts TO service_role;
ALTER TABLE public.admin_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_prompts_admin_all ON public.admin_prompts FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE TRIGGER admin_prompts_set_updated_at BEFORE UPDATE ON public.admin_prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Approve / reject pro request
CREATE OR REPLACE FUNCTION public.decide_pro_request(_id uuid, _approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT user_id INTO _uid FROM public.pro_requests WHERE id = _id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not found';
  END IF;
  UPDATE public.pro_requests SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END WHERE id = _id;
  IF _approve THEN
    UPDATE public.profiles SET plan = 'pro', plan_started_at = now() WHERE id = _uid;
  ELSE
    UPDATE public.profiles SET plan = 'free', plan_started_at = NULL WHERE id = _uid;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.decide_pro_request(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_pro_request(uuid, boolean) TO authenticated;