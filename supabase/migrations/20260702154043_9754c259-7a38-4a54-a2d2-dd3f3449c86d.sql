DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;

CREATE POLICY "Users can join sessions"
ON public.session_participants
FOR INSERT
WITH CHECK (
  user_id = get_my_profile_id()
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND (
        s.creator_id = get_my_profile_id()
        OR s.user1_id = get_my_profile_id()
        OR s.user2_id = get_my_profile_id()
        OR (
          s.is_public = true
          AND (
            -- enforce same-gender: joiner's gender must match creator's gender
            (SELECT gender FROM public.profiles WHERE id = s.creator_id) = public.get_my_gender()
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.invitations i
          WHERE i.status = 'accepted'::invitation_status
            AND (
              (i.sender_id = s.creator_id AND i.receiver_id = get_my_profile_id())
              OR (i.receiver_id = s.creator_id AND i.sender_id = get_my_profile_id())
            )
        )
      )
  )
);