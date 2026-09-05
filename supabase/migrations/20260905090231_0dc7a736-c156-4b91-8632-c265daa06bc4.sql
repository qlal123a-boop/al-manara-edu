-- Remove the definer view; use column-level grants instead
DROP VIEW IF EXISTS public.game_leaderboard;

DROP POLICY IF EXISTS game_scores_select_own_or_admin ON public.game_scores;
REVOKE ALL ON public.game_scores FROM anon;
GRANT SELECT (id, game, score, created_at) ON public.game_scores TO anon;
CREATE POLICY game_scores_public_read ON public.game_scores
  FOR SELECT TO anon, authenticated USING (true);

-- Function execution: default deny, then grant only where needed
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_store_item(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_registered_user_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_registered_users() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_users_with_roles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_user_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_visitor_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_points(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_store_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_registered_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_registered_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
