-- Create search_logs table for tracking searches without results
CREATE TABLE public.search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_term TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'general',
  results_count INTEGER NOT NULL DEFAULT 0,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert search logs (anonymous tracking)
CREATE POLICY "Anyone can create search logs"
  ON public.search_logs
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view/manage
CREATE POLICY "Admins can view search logs"
  ON public.search_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update search logs"
  ON public.search_logs
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete search logs"
  ON public.search_logs
  FOR DELETE
  USING (is_admin());

-- Index for performance
CREATE INDEX idx_search_logs_term ON public.search_logs(search_term);
CREATE INDEX idx_search_logs_created ON public.search_logs(created_at DESC);