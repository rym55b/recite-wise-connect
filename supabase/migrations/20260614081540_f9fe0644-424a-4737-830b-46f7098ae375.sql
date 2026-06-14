
-- 1) Invitations: enforce same-gender at RLS layer
DROP POLICY IF EXISTS "Users can send invitations" ON public.invitations;
CREATE POLICY "Users can send invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = public.get_my_profile_id()
  AND sender_id <> receiver_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles ps
    JOIN public.profiles pr ON pr.id = invitations.receiver_id
    WHERE ps.id = invitations.sender_id
      AND ps.gender = pr.gender
  )
);

-- 2) Ratings: one rating per (session, rater, rated)
DELETE FROM public.ratings r
USING public.ratings r2
WHERE r.session_id = r2.session_id
  AND r.rater_id  = r2.rater_id
  AND r.rated_id  = r2.rated_id
  AND r.ctid < r2.ctid;

ALTER TABLE public.ratings
  ADD CONSTRAINT ratings_unique_per_session_pair
  UNIQUE (session_id, rater_id, rated_id);

-- 3) session_participants: only allow joining if authorized
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
CREATE POLICY "Users can join sessions"
ON public.session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.get_my_profile_id()
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND (
        s.is_public = true
        OR s.creator_id = public.get_my_profile_id()
        OR s.user1_id   = public.get_my_profile_id()
        OR s.user2_id   = public.get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.invitations i
          WHERE i.status = 'accepted'
            AND (
              (i.sender_id = s.creator_id AND i.receiver_id = public.get_my_profile_id())
              OR (i.receiver_id = s.creator_id AND i.sender_id = public.get_my_profile_id())
            )
        )
      )
  )
);
