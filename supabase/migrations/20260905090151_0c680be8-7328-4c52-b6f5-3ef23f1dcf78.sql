-- 1. Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_points(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_store_item(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_registered_user_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_registered_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_users_with_roles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_user_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- 2. game_scores: hide raw user_id from public reads
DROP POLICY IF EXISTS "public leaderboard" ON public.game_scores;
CREATE POLICY game_scores_select_own_or_admin ON public.game_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin());

CREATE OR REPLACE VIEW public.game_leaderboard AS
  SELECT gs.game,
         gs.score,
         gs.created_at,
         COALESCE(p.display_name, 'لاعب') AS display_name
  FROM public.game_scores gs
  LEFT JOIN public.profiles p ON p.id = gs.user_id;

REVOKE ALL ON public.game_leaderboard FROM anon, authenticated;
GRANT SELECT ON public.game_leaderboard TO anon, authenticated;

-- 3. quiz_attempts: scope policy to authenticated only
DROP POLICY IF EXISTS quiz_select_own_or_admin ON public.quiz_attempts;
CREATE POLICY quiz_select_own_or_admin ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin());

-- 4. site_settings: only non-sensitive public keys readable by everyone
DROP POLICY IF EXISTS settings_select_all ON public.site_settings;
CREATE POLICY settings_select_public_keys ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('feature_toggles', 'brand', 'visitor_count', 'quranic_verses'));
CREATE POLICY settings_select_admin ON public.site_settings
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
