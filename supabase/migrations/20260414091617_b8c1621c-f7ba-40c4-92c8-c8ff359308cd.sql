
DROP FUNCTION IF EXISTS public.search_businesses_for_claim(text, integer);

CREATE OR REPLACE FUNCTION public.search_businesses_for_claim(p_query text, p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, name text, city text, category_id uuid, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(p_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.city,
    b.category_id,
    b.is_active
  FROM businesses b
  WHERE 
    b.claim_status IN ('unclaimed', 'none', 'rejected')
    AND b.name ILIKE '%' || p_query || '%'
  ORDER BY 
    similarity(b.name, p_query) DESC,
    b.name ASC
  LIMIT p_limit;
END;
$$;
