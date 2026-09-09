CREATE OR REPLACE FUNCTION public.am_i_in_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_participants sp
    WHERE sp.session_id = _session_id
      AND sp.user_id = public.get_my_profile_id()
      AND sp.left_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = _session_id
      AND (
        s.creator_id = public.get_my_profile_id()
        OR s.user1_id = public.get_my_profile_id()
        OR s.user2_id = public.get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.session_participants sp
          WHERE sp.session_id = s.id
            AND sp.user_id = public.get_my_profile_id()
            AND sp.left_at IS NULL
        )
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.am_i_in_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.am_i_in_session(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_session(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can read participants of their sessions" ON public.session_participants;
CREATE POLICY "Users can read participants of their sessions"
ON public.session_participants FOR SELECT TO authenticated
USING (public.can_view_session(session_id));

DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
ON public.sessions FOR SELECT TO authenticated
USING (
  user1_id = public.get_my_profile_id()
  OR user2_id = public.get_my_profile_id()
  OR creator_id = public.get_my_profile_id()
  OR public.am_i_in_session(id)
);