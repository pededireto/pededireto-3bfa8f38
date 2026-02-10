
-- Allow anyone to insert businesses with self_service registration
CREATE POLICY "Anyone can register a business via self service"
ON public.businesses
FOR INSERT
WITH CHECK (
  is_active = false
  AND commercial_status = 'nao_contactado'
  AND subscription_status = 'inactive'
  AND registration_source = 'self_service'
  AND name IS NOT NULL
  AND LENGTH(name) >= 2
  AND LENGTH(name) <= 200
  AND slug IS NOT NULL
);
