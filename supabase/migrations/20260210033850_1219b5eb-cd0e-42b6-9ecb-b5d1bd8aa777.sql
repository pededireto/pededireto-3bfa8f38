-- Fix overly permissive INSERT policy on search_logs
DROP POLICY IF EXISTS "Anyone can create search logs" ON public.search_logs;
CREATE POLICY "Anyone can create search logs"
  ON public.search_logs
  FOR INSERT
  WITH CHECK (
    search_term IS NOT NULL AND length(search_term) >= 2 AND length(search_term) <= 200
    AND results_count >= 0
    AND is_reviewed = false
  );