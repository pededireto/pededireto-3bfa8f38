-- Add INSERT and UPDATE policies for commercials on business_commercial_assignments
CREATE POLICY "Commercials can insert own assignments"
  ON public.business_commercial_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (commercial_id = auth.uid() AND is_commercial());

CREATE POLICY "Commercials can update own assignments"
  ON public.business_commercial_assignments
  FOR UPDATE
  TO authenticated
  USING (commercial_id = auth.uid() AND is_commercial())
  WITH CHECK (commercial_id = auth.uid() AND is_commercial());

-- Allow commercials to see ALL assignments for dedup checks
DROP POLICY IF EXISTS "Commercial users can view own assignments" ON public.business_commercial_assignments;

CREATE POLICY "Commercial users can view assignments"
  ON public.business_commercial_assignments
  FOR SELECT
  TO authenticated
  USING (is_commercial() OR is_admin());

-- Fix commercial pipeline policy
DROP POLICY IF EXISTS "Commercials see own pipeline" ON public.commercial_pipeline;

CREATE POLICY "Commercials manage own pipeline"
  ON public.commercial_pipeline
  FOR ALL
  TO authenticated
  USING (assigned_to = auth.uid() AND is_commercial())
  WITH CHECK (assigned_to = auth.uid() AND is_commercial());