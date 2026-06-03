
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = _session_id
      AND (
        s.user1_id = public.get_my_profile_id()
        OR s.user2_id = public.get_my_profile_id()
        OR s.creator_id = public.get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.session_participants sp
          WHERE sp.session_id = _session_id
            AND sp.user_id = public.get_my_profile_id()
            AND sp.left_at IS NULL
        )
      )
  )
$$;
