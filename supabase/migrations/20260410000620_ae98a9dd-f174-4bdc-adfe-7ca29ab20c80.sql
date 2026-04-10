
-- ==============================================
-- FIX 1: Allow public SELECT on businesses for is_active rows
-- The previous USING(false) policy broke all public access
-- ==============================================
CREATE POLICY "Public can view active businesses"
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ==============================================
-- FIX 2: Recreate search RPC as SECURITY DEFINER
-- so it can read businesses even for anon users
-- ==============================================
CREATE OR REPLACE FUNCTION public.search_businesses_and_subcategories(search_term text)
RETURNS TABLE(
  result_type text,
  result_id uuid,
  result_name text,
  result_slug text,
  category_name text,
  category_slug text,
  relevance integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_term text;
  expanded_terms text[];
  syn_term text;
BEGIN
  normalized_term := lower(unaccent(search_term));
  
  expanded_terms := ARRAY[normalized_term];
  FOR syn_term IN 
    SELECT lower(unaccent(ss.equivalente)) 
    FROM search_synonyms ss 
    WHERE lower(unaccent(ss.termo)) = normalized_term
  LOOP
    expanded_terms := array_append(expanded_terms, syn_term);
  END LOOP;

  -- Search subcategories
  RETURN QUERY
  SELECT
    'subcategory'::text as r_type,
    s.id as r_id,
    s.name as r_name,
    s.slug as r_slug,
    c.name as c_name,
    c.slug as c_slug,
    CASE
      WHEN lower(unaccent(s.name)) = ANY(expanded_terms) THEN 1
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(s.name)) LIKE t || '%') THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(s.name)) LIKE '%' || t || '%') THEN 3
      ELSE 4
    END as r_relevance
  FROM subcategories s
  JOIN categories c ON c.id = s.category_id
  WHERE s.is_active = true
    AND c.is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(expanded_terms) t 
      WHERE lower(unaccent(s.name)) LIKE '%' || t || '%'
        OR lower(unaccent(COALESCE(s.description, ''))) LIKE '%' || t || '%'
    );

  -- Search businesses
  RETURN QUERY
  SELECT
    'business'::text as r_type,
    b.id as r_id,
    b.name as r_name,
    b.slug as r_slug,
    c.name as c_name,
    c.slug as c_slug,
    CASE
      WHEN lower(unaccent(b.name)) = ANY(expanded_terms) THEN 1
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(b.name)) LIKE t || '%') THEN 2
      WHEN EXISTS (SELECT 1 FROM unnest(expanded_terms) t WHERE lower(unaccent(b.name)) LIKE '%' || t || '%') THEN 3
      ELSE 5
    END as r_relevance
  FROM businesses b
  LEFT JOIN categories c ON c.id = b.category_id
  WHERE b.is_active = true
    AND (
      EXISTS (
        SELECT 1 FROM unnest(expanded_terms) t 
        WHERE lower(unaccent(b.name)) LIKE '%' || t || '%'
          OR lower(unaccent(COALESCE(b.description, ''))) LIKE '%' || t || '%'
          OR lower(unaccent(COALESCE(c.name, ''))) LIKE '%' || t || '%'
          OR lower(unaccent(COALESCE(b.city, ''))) LIKE '%' || t || '%'
      )
      OR EXISTS (
        SELECT 1 FROM business_cities bc, unnest(expanded_terms) t
        WHERE bc.business_id = b.id
          AND lower(unaccent(bc.city_name)) LIKE '%' || t || '%'
      )
    );

  RETURN;
END;
$$;

-- ==============================================
-- FIX 3: Update businesses_public view to include claim_status
-- ==============================================
CREATE OR REPLACE VIEW public.businesses_public
WITH (security_invoker=on) AS
WITH plan_level AS (
  SELECT b.id,
    CASE
      WHEN b.is_premium = true AND b.subscription_status = 'active' THEN 'pro'
      WHEN b.is_premium = false AND b.subscription_status = 'active' AND b.subscription_plan != 'free' THEN 'start'
      ELSE 'free'
    END AS level
  FROM businesses b
)
SELECT
  b.id, b.name, b.slug, b.description, b.logo_url, b.city, b.zone, b.alcance,
  b.public_address, b.category_id, b.subcategory_id,
  b.is_featured, b.is_premium, b.premium_level, b.display_order, b.ranking_score,
  pl.level AS plan_level,
  CASE
    WHEN pl.level = 'pro' THEN 'PRO'
    WHEN pl.level = 'start' THEN 'START'
    ELSE NULL
  END AS badge,
  b.cta_phone, b.cta_email, b.cta_website,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekdays ELSE NULL END AS schedule_weekdays,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekend ELSE NULL END AS schedule_weekend,
  CASE
    WHEN b.show_gallery = false OR b.images IS NULL THEN NULL
    WHEN pl.level = 'pro' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 6) t)
    WHEN pl.level = 'start' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 2) t)
    ELSE NULL
  END AS images,
  CASE WHEN pl.level = 'pro' AND b.show_whatsapp = true THEN b.cta_whatsapp ELSE NULL END AS cta_whatsapp,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.instagram_url ELSE NULL END AS instagram_url,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.facebook_url ELSE NULL END AS facebook_url,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.other_social_url ELSE NULL END AS other_social_url,
  b.claim_status
FROM businesses b
JOIN plan_level pl ON pl.id = b.id
WHERE b.is_active = true;

-- ==============================================
-- FIX 4: Create message_templates table
-- ==============================================
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'sms',
  subcategory TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read message templates"
  ON public.message_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage message templates"
  ON public.message_templates FOR ALL
  TO authenticated
  USING (is_admin());

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
