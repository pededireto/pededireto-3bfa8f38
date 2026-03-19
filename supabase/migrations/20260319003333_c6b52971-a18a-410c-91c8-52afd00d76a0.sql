CREATE TABLE IF NOT EXISTS public.monthly_digest_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  sent_for_month text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  recipient_email text NOT NULL,
  UNIQUE(business_id, sent_for_month)
);

ALTER TABLE public.monthly_digest_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.monthly_digest_logs
  FOR ALL USING (false);