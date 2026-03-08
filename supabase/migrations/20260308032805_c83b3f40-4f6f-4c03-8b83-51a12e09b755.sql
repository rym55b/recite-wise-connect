
-- Add role column to matchmaking_queue for reader/corrector matching
CREATE TYPE public.matchmaking_role AS ENUM ('reader', 'corrector');

ALTER TABLE public.matchmaking_queue 
ADD COLUMN role public.matchmaking_role NOT NULL DEFAULT 'reader';
