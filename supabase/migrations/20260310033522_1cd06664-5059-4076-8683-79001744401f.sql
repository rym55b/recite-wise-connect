
-- Messages table for both session chat and private messaging
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Index for fast lookups
CREATE INDEX idx_messages_session ON public.messages(session_id, created_at);
CREATE INDEX idx_messages_private ON public.messages(sender_id, receiver_id, created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received, or in sessions they participate in
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    sender_id = get_my_profile_id()
    OR receiver_id = get_my_profile_id()
    OR (session_id IS NOT NULL AND is_session_participant(session_id))
  );

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = get_my_profile_id()
    AND (
      -- Private message: must have receiver
      (session_id IS NULL AND receiver_id IS NOT NULL)
      -- Session message: must be participant
      OR (session_id IS NOT NULL AND is_session_participant(session_id))
    )
  );

-- Users can update read_at on messages they received
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING (receiver_id = get_my_profile_id())
  WITH CHECK (receiver_id = get_my_profile_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
