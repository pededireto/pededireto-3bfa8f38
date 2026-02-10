
-- Create expiration_logs table
CREATE TABLE public.expiration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_price NUMERIC NOT NULL DEFAULT 0,
  expired_at DATE NOT NULL,
  deactivated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_status TEXT NOT NULL DEFAULT 'nao_contactado',
  contacted_at TIMESTAMPTZ,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.expiration_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access policies
CREATE POLICY "Admins can view all expiration logs"
ON public.expiration_logs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert expiration logs"
ON public.expiration_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update expiration logs"
ON public.expiration_logs FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete expiration logs"
ON public.expiration_logs FOR DELETE
TO authenticated
USING (public.is_admin());

-- Also allow service role (edge functions) to insert
CREATE POLICY "Service role can insert expiration logs"
ON public.expiration_logs FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can select expiration logs"
ON public.expiration_logs FOR SELECT
TO service_role
USING (true);
