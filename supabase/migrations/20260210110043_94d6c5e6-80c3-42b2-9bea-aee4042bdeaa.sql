
-- Create featured_categories table
CREATE TABLE public.featured_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL UNIQUE REFERENCES public.categories(id) ON DELETE CASCADE,
  cover_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active featured categories"
  ON public.featured_categories FOR SELECT
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can view all featured categories"
  ON public.featured_categories FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert featured categories"
  ON public.featured_categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update featured categories"
  ON public.featured_categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete featured categories"
  ON public.featured_categories FOR DELETE
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_featured_categories_updated_at
  BEFORE UPDATE ON public.featured_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
