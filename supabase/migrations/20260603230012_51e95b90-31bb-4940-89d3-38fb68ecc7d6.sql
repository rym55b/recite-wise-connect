
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  user1_id = public.get_my_profile_id()
  OR user2_id = public.get_my_profile_id()
  OR creator_id = public.get_my_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.session_participants sp
    WHERE sp.session_id = sessions.id
      AND sp.user_id = public.get_my_profile_id()
  )
);
