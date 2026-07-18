
-- 1) Replace broad same-gender SELECT with narrower rules
DROP POLICY IF EXISTS "Users can read own or same-gender profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users read available same-gender profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  gender = public.get_my_gender()
  AND is_available = true
);

CREATE POLICY "Users read related same-gender profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  gender = public.get_my_gender()
  AND (
    EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE (i.sender_id = public.get_my_profile_id() AND i.receiver_id = profiles.id)
         OR (i.receiver_id = public.get_my_profile_id() AND i.sender_id = profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE (s.user1_id = public.get_my_profile_id() AND s.user2_id = profiles.id)
         OR (s.user2_id = public.get_my_profile_id() AND s.user1_id = profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE (m.sender_id = public.get_my_profile_id() AND m.receiver_id = profiles.id)
         OR (m.receiver_id = public.get_my_profile_id() AND m.sender_id = profiles.id)
    )
  )
);

CREATE POLICY "Admins and moderators read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- 2) Allow users to delete their own profile
CREATE POLICY "Users delete own profile"
ON public.profiles FOR DELETE TO authenticated
USING (user_id = auth.uid());
