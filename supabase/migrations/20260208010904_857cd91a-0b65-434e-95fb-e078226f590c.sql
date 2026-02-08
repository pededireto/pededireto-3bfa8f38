
-- Create junction table for many-to-many business ↔ subcategory relationship
CREATE TABLE public.business_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, subcategory_id)
);

-- Create indexes for performance
CREATE INDEX idx_business_subcategories_business ON public.business_subcategories(business_id);
CREATE INDEX idx_business_subcategories_subcategory ON public.business_subcategories(subcategory_id);

-- Enable RLS
ALTER TABLE public.business_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can view
CREATE POLICY "Anyone can view business subcategories"
  ON public.business_subcategories
  FOR SELECT
  USING (true);

-- RLS: admins can manage
CREATE POLICY "Admins can insert business subcategories"
  ON public.business_subcategories
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update business subcategories"
  ON public.business_subcategories
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete business subcategories"
  ON public.business_subcategories
  FOR DELETE
  USING (public.is_admin());

-- Migrate existing subcategory_id data into junction table
INSERT INTO public.business_subcategories (business_id, subcategory_id)
SELECT id, subcategory_id
FROM public.businesses
WHERE subcategory_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create a Postgres function for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.search_businesses_and_subcategories(search_term text)
RETURNS TABLE(
  result_type text,
  result_id uuid,
  result_name text,
  result_slug text,
  category_name text,
  category_slug text,
  relevance int
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  normalized_term text;
BEGIN
  normalized_term := lower(unaccent(search_term));

  -- Search subcategories
  RETURN QUERY
  SELECT
    'subcategory'::text as result_type,
    s.id as result_id,
    s.name as result_name,
    s.slug as result_slug,
    c.name as category_name,
    c.slug as category_slug,
    CASE
      WHEN lower(unaccent(s.name)) = normalized_term THEN 1
      WHEN lower(unaccent(s.name)) LIKE normalized_term || '%' THEN 2
      WHEN lower(unaccent(s.name)) LIKE '%' || normalized_term || '%' THEN 3
      ELSE 4
    END as relevance
  FROM subcategories s
  JOIN categories c ON c.id = s.category_id
  WHERE s.is_active = true
    AND c.is_active = true
    AND (
      lower(unaccent(s.name)) LIKE '%' || normalized_term || '%'
      OR lower(unaccent(s.description)) LIKE '%' || normalized_term || '%'
    );

  -- Search businesses
  RETURN QUERY
  SELECT
    'business'::text as result_type,
    b.id as result_id,
    b.name as result_name,
    b.slug as result_slug,
    c.name as category_name,
    c.slug as category_slug,
    CASE
      WHEN lower(unaccent(b.name)) = normalized_term THEN 1
      WHEN lower(unaccent(b.name)) LIKE normalized_term || '%' THEN 2
      WHEN lower(unaccent(b.name)) LIKE '%' || normalized_term || '%' THEN 3
      ELSE 5
    END as relevance
  FROM businesses b
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE b.is_active = true
    AND (
      lower(unaccent(b.name)) LIKE '%' || normalized_term || '%'
      OR lower(unaccent(b.description)) LIKE '%' || normalized_term || '%'
      OR lower(unaccent(COALESCE(c.name, ''))) LIKE '%' || normalized_term || '%'
    );

  RETURN;
END;
$$;
