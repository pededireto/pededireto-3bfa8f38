
-- Add new columns for advanced page features
ALTER TABLE public.institutional_pages
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_in_header boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_footer boolean NOT NULL DEFAULT true;

-- Add constraint for page_type values
ALTER TABLE public.institutional_pages
  ADD CONSTRAINT institutional_pages_page_type_check 
  CHECK (page_type IN ('simple', 'advanced'));

-- Allow admins to delete pages
CREATE POLICY "Admins can delete pages"
  ON public.institutional_pages
  FOR DELETE
  USING (is_admin());

-- Allow admins to insert pages
CREATE POLICY "Admins can insert pages"
  ON public.institutional_pages
  FOR INSERT
  WITH CHECK (is_admin());
