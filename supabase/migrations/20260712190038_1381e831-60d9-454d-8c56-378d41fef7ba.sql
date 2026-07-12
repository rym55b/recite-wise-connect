
-- Revoke public/anon/authenticated EXECUTE on trigger-only SECURITY DEFINER functions.
-- These are invoked by triggers and never need to be called by client roles.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_average_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_sessions_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_session_participants_update() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: only signed-in users need EXECUTE. Revoke anon.
REVOKE ALL ON FUNCTION public.get_my_profile_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_session_participant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_gender() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_gender() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
