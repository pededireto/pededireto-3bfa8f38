CREATE POLICY "Business members can view their own business"
ON businesses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users
    WHERE business_users.business_id = businesses.id
    AND business_users.user_id = auth.uid()
  )
);