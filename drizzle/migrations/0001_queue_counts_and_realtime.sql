-- Live waiting counters (same gender only, excludes the caller), no personal data exposed
CREATE OR REPLACE FUNCTION public.get_waiting_counts()
RETURNS TABLE (readers integer, correctors integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE q.role = 'reader'), 0)::int,
    COALESCE(COUNT(*) FILTER (WHERE q.role = 'corrector'), 0)::int
  FROM public.matchmaking_queue q
  JOIN public.profiles p ON p.id = q.user_id
  WHERE p.gender = public.get_my_gender()
    AND q.user_id IS DISTINCT FROM public.get_my_profile_id()
    AND q.joined_at > now() - interval '10 minutes'
$$;

REVOKE ALL ON FUNCTION public.get_waiting_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_waiting_counts() TO authenticated, service_role;

-- Realtime for paired sessions so both sides react to status/passage changes
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
