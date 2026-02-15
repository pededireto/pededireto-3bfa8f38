
-- Drop the existing policy and recreate with broader coverage
DROP POLICY IF EXISTS "Business owners can view own analytics" ON public.analytics_events;

CREATE POLICY "Business owners can view own analytics"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      -- Via business_users table (claim flow)
      SELECT bu.business_id FROM public.business_users bu WHERE bu.user_id = auth.uid()
      UNION
      -- Via owner_id direct link
      SELECT b.id FROM public.businesses b WHERE b.owner_id = auth.uid()
      UNION
      -- Via owner_email match
      SELECT b.id FROM public.businesses b WHERE b.owner_email = (
        SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1
      )
    )
  );
