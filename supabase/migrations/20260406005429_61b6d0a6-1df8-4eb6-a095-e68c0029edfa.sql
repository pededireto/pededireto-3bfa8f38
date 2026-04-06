
-- Table for storing business API keys for image generation
CREATE TABLE public.business_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'google', 'ideogram')),
  api_key_encrypted TEXT NOT NULL,
  api_key_hint TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider)
);

ALTER TABLE public.business_api_keys ENABLE ROW LEVEL SECURITY;

-- Only business owners can manage their API keys
CREATE POLICY "Business owners can manage their API keys"
  ON public.business_api_keys
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage all API keys"
  ON public.business_api_keys
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role access for edge functions
CREATE POLICY "Service role full access to API keys"
  ON public.business_api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_business_api_keys_updated_at
  BEFORE UPDATE ON public.business_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
