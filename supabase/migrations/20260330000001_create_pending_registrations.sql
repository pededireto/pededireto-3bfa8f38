-- Tabela para registos de neg�cios pendentes (criada durante onboarding)
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pending registrations"
ON public.pending_registrations
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_pending_registrations_user_id 
ON public.pending_registrations(user_id) 
WHERE processed_at IS NULL;
