
DROP POLICY IF EXISTS "Receivers can update invitations" ON public.invitations;
CREATE POLICY "Receivers can update invitations"
ON public.invitations
FOR UPDATE
TO authenticated
USING (receiver_id = public.get_my_profile_id() AND status = 'pending'::invitation_status)
WITH CHECK (
  receiver_id = public.get_my_profile_id()
  AND status IN ('accepted'::invitation_status, 'rejected'::invitation_status)
);

DROP POLICY IF EXISTS "Participants can update sessions" ON public.sessions;
CREATE POLICY "Participants can update sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (user1_id = public.get_my_profile_id() OR user2_id = public.get_my_profile_id() OR creator_id = public.get_my_profile_id())
WITH CHECK (user1_id = public.get_my_profile_id() OR user2_id = public.get_my_profile_id() OR creator_id = public.get_my_profile_id());
