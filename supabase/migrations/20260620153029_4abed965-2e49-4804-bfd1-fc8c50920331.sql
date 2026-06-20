
-- 1) Helper: caller's gender (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_gender()
RETURNS gender_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gender FROM public.profiles WHERE user_id = auth.uid()
$$;

-- 2) Restrict profile reads to own profile or same-gender profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own or same-gender profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR gender = public.get_my_gender()
);

-- 3) Tighten sessions INSERT: solo/group-by-self OR accepted invitation between user1 and user2
DROP POLICY IF EXISTS "Authenticated can insert sessions" ON public.sessions;

CREATE POLICY "Authenticated can insert sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo/group session created by self where caller is the sole party
  (
    creator_id = public.get_my_profile_id()
    AND user1_id = public.get_my_profile_id()
    AND user2_id = public.get_my_profile_id()
  )
  OR
  -- Paired session: caller is one of the two AND an accepted invitation exists between them
  (
    (user1_id = public.get_my_profile_id() OR user2_id = public.get_my_profile_id())
    AND user1_id <> user2_id
    AND EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.status = 'accepted'
        AND (
          (i.sender_id = sessions.user1_id AND i.receiver_id = sessions.user2_id)
          OR (i.sender_id = sessions.user2_id AND i.receiver_id = sessions.user1_id)
        )
    )
  )
);
