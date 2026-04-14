
DROP FUNCTION IF EXISTS public.search_businesses_for_claim(text, integer);

CREATE FUNCTION public.search_businesses_for_claim(p_query text, p_limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  city text,
  category_id uuid,
  is_active boolean,
  legal_fields_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.name,
    b.city,
    b.category_id,
    b.is_active,
    (
      CASE WHEN b.nif IS NOT NULL AND b.nif <> '' THEN 1 ELSE 0 END +
      CASE WHEN b.address IS NOT NULL AND b.address <> '' THEN 1 ELSE 0 END +
      CASE WHEN b.owner_name IS NOT NULL AND b.owner_name <> '' THEN 1 ELSE 0 END +
      CASE WHEN b.owner_phone IS NOT NULL AND b.owner_phone <> '' THEN 1 ELSE 0 END +
      CASE WHEN b.owner_email IS NOT NULL AND b.owner_email <> '' THEN 1 ELSE 0 END
    )::integer AS legal_fields_count
  FROM businesses b
  WHERE
    b.name ILIKE '%' || p_query || '%'
    AND (b.claim_status IN ('unclaimed', 'none', 'rejected') OR b.claim_status IS NULL)
  ORDER BY
    b.is_active DESC,
    similarity(b.name, p_query) DESC
  LIMIT p_limit;
$$;
