
-- Add RLS policy so business owners can read their own analytics
CREATE POLICY "Business owners can view own analytics"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT bu.business_id 
      FROM public.business_users bu 
      WHERE bu.user_id = auth.uid()
    )
  );
