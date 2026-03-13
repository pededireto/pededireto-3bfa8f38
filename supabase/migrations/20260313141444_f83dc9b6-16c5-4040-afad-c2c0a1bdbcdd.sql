
CREATE OR REPLACE FUNCTION public.search_businesses_and_subcategories(search_term text)
RETURNS TABLE(result_type text, result_id uuid, result_name text, result_slug text, category_name text, category_slug text, relevance integer)
LANGUAGE plpgsql STABLE
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

  -- Search businesses by name, description, category, city, or business_cities
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
