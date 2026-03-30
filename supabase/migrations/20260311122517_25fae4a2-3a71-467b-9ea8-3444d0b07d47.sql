-- Allow all authenticated users to see active commission models (for affiliate landing page & dashboards)
CREATE POLICY "Authenticated users can view active models"
ON public.commission_models
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow anonymous users to see active models (for public landing page /afiliados)
CREATE POLICY "Anon users can view active models"
ON public.commission_models
FOR SELECT
TO anon
USING (is_active = true);
