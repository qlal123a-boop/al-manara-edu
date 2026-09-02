CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  plan_started_at timestamptz,
  onboarded boolean NOT NULL DEFAULT false,
  ai_usage_date date NOT NULL DEFAULT CURRENT_DATE,
  ai_usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_super_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_limit integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _plan text;
  _count integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'auth', 'remaining', 0);
  END IF;

  INSERT INTO public.profiles (id) VALUES (_uid) ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles
     SET ai_usage_count = CASE WHEN ai_usage_date = CURRENT_DATE THEN ai_usage_count ELSE 0 END,
         ai_usage_date = CURRENT_DATE
   WHERE id = _uid;

  SELECT plan, ai_usage_count INTO _plan, _count FROM public.profiles WHERE id = _uid;

  IF _plan = 'pro' THEN
    RETURN jsonb_build_object('allowed', true, 'plan', 'pro', 'remaining', -1);
  END IF;

  IF _count >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota', 'plan', 'free', 'remaining', 0);
  END IF;

  UPDATE public.profiles SET ai_usage_count = ai_usage_count + 1 WHERE id = _uid;
  RETURN jsonb_build_object('allowed', true, 'plan', 'free', 'remaining', _limit - _count - 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO authenticated;