
-- 1) Tighten session_participants SELECT: drop is_public branch
DROP POLICY IF EXISTS "Users can read participants of their sessions" ON public.session_participants;

CREATE POLICY "Users can read participants of their sessions"
ON public.session_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND (
        s.creator_id = public.get_my_profile_id()
        OR s.user1_id = public.get_my_profile_id()
        OR s.user2_id = public.get_my_profile_id()
        OR EXISTS (
          SELECT 1 FROM public.session_participants sp
          WHERE sp.session_id = session_participants.session_id
            AND sp.user_id = public.get_my_profile_id()
            AND sp.left_at IS NULL
        )
      )
  )
);

-- 2) Restrict sensitive-column edits on sessions to creator only via trigger
CREATE OR REPLACE FUNCTION public.guard_sessions_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := public.get_my_profile_id();
BEGIN
  IF OLD.creator_id IS DISTINCT FROM me THEN
    IF NEW.access_code      IS DISTINCT FROM OLD.access_code
    OR NEW.is_public        IS DISTINCT FROM OLD.is_public
    OR NEW.creator_id       IS DISTINCT FROM OLD.creator_id
    OR NEW.max_participants IS DISTINCT FROM OLD.max_participants
    OR NEW.session_type     IS DISTINCT FROM OLD.session_type
    OR NEW.is_group         IS DISTINCT FROM OLD.is_group
    OR NEW.user1_id         IS DISTINCT FROM OLD.user1_id
    OR NEW.user2_id         IS DISTINCT FROM OLD.user2_id
    OR NEW.title            IS DISTINCT FROM OLD.title
    THEN
      RAISE EXCEPTION 'Only the session creator may modify sensitive session fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_sessions_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sessions_guard_update ON public.sessions;
CREATE TRIGGER sessions_guard_update
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.guard_sessions_update();
