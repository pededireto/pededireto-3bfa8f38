-- Allow CS team to also manage bug reports
DROP POLICY IF EXISTS "onboarding_can_manage_bug_reports" ON public.bug_reports;

CREATE POLICY "team_can_manage_bugs" ON public.bug_reports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('onboarding', 'cs', 'admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('onboarding', 'cs', 'admin', 'super_admin')
  )
);
