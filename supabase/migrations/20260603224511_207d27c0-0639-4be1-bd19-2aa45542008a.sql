REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_average_rating() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON public.session_participants;
DROP POLICY IF EXISTS "Users can read participants of their sessions" ON public.session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.session_participants;

CREATE POLICY "Users can join sessions"
ON public.session_participants
FOR INSERT TO authenticated
WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "Users can leave sessions"
ON public.session_participants
FOR DELETE TO authenticated
USING (
  (user_id = get_my_profile_id())
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.creator_id = get_my_profile_id()
  )
);

CREATE POLICY "Users can read participants of their sessions"
ON public.session_participants
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND (
        s.is_public = true
        OR s.creator_id = get_my_profile_id()
        OR s.user1_id = get_my_profile_id()
        OR s.user2_id = get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.session_participants sp
          WHERE sp.session_id = session_participants.session_id
            AND sp.user_id = get_my_profile_id()
        )
      )
  )
);

CREATE POLICY "Users can update own participation"
ON public.session_participants
FOR UPDATE TO authenticated
USING (
  (user_id = get_my_profile_id())
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.creator_id = get_my_profile_id()
  )
);