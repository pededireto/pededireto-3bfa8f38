CREATE OR REPLACE FUNCTION public.get_subcategory_business_counts()
RETURNS TABLE(subcategory_id uuid, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bs.subcategory_id, COUNT(DISTINCT bs.business_id) as count
  FROM business_subcategories bs
  INNER JOIN businesses b ON b.id = bs.business_id
  WHERE b.is_active = true
  GROUP BY bs.subcategory_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_subcategory_business_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_subcategory_business_counts() TO authenticated;