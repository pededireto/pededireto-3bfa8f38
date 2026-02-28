
-- =============================================
-- BLOCO 2: archived_at/archived_by em request_business_matches
-- =============================================

ALTER TABLE public.request_business_matches
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS archived_by uuid DEFAULT NULL REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_rbm_archived
  ON public.request_business_matches (business_id, archived_at);
