
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

UPDATE public.reports SET status = 'accepted' WHERE status = 'reviewing';
UPDATE public.reports SET status = 'rejected' WHERE status = 'dismissed';

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('pending','accepted','rejected','resolved'));
