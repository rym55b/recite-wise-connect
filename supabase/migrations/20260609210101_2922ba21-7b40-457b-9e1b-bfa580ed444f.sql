
-- Tighten session_participants UPDATE: prevent host from forging membership via user_id reassignment
DROP POLICY IF EXISTS "Users can update own participation" ON public.session_participants;

CREATE POLICY "Users can update own participation"
ON public.session_participants
FOR UPDATE
TO authenticated
USING (
  user_id = public.get_my_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.creator_id = public.get_my_profile_id()
  )
)
WITH CHECK (
  user_id = public.get_my_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.creator_id = public.get_my_profile_id()
  )
);

-- Trigger to block immutable field changes and restrict host edits to moderation fields only
CREATE OR REPLACE FUNCTION public.guard_session_participants_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := public.get_my_profile_id();
  is_creator boolean;
BEGIN
  -- Immutable identity fields for everyone
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.joined_at IS DISTINCT FROM OLD.joined_at
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify identity fields of a session participant';
  END IF;

  -- If the actor is not the participant themselves, they must be the session creator
  -- and may only change moderation fields (is_muted_by_host, hand_raised, left_at).
  IF OLD.user_id IS DISTINCT FROM me THEN
    SELECT (s.creator_id = me) INTO is_creator
    FROM public.sessions s WHERE s.id = OLD.session_id;

    IF NOT COALESCE(is_creator, false) THEN
      RAISE EXCEPTION 'Not authorized to update this participant row';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_session_participants_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_session_participants_update_trg ON public.session_participants;
CREATE TRIGGER guard_session_participants_update_trg
BEFORE UPDATE ON public.session_participants
FOR EACH ROW
EXECUTE FUNCTION public.guard_session_participants_update();
