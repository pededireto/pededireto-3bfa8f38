
-- Fix subcategory counts to include both junction AND direct subcategory_id
CREATE OR REPLACE FUNCTION public.get_subcategory_business_counts()
RETURNS TABLE(subcategory_id uuid, count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT sub_id, COUNT(DISTINCT biz_id) as count
  FROM (
    -- Via junction table
    SELECT bs.subcategory_id AS sub_id, bs.business_id AS biz_id
    FROM business_subcategories bs
    INNER JOIN businesses b ON b.id = bs.business_id
    WHERE b.is_active = true
    UNION
    -- Via direct subcategory_id on businesses
    SELECT b.subcategory_id AS sub_id, b.id AS biz_id
    FROM businesses b
    WHERE b.is_active = true
      AND b.subcategory_id IS NOT NULL
  ) combined
  GROUP BY sub_id;
$$;

-- New RPC for category counts (server-side, no 1000-row limit)
CREATE OR REPLACE FUNCTION public.get_category_business_counts()
RETURNS TABLE(category_id uuid, count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cat_id, COUNT(DISTINCT biz_id) as count
  FROM (
    -- Direct category_id
    SELECT b.category_id AS cat_id, b.id AS biz_id
    FROM businesses b
    WHERE b.is_active = true AND b.category_id IS NOT NULL
    UNION
    -- Via business_categories junction
    SELECT bc.category_id AS cat_id, bc.business_id AS biz_id
    FROM business_categories bc
    INNER JOIN businesses b ON b.id = bc.business_id
    WHERE b.is_active = true
    UNION
    -- Via subcategories -> category
    SELECT s.category_id AS cat_id, bs.business_id AS biz_id
    FROM business_subcategories bs
    INNER JOIN businesses b ON b.id = bs.business_id
    INNER JOIN subcategories s ON s.id = bs.subcategory_id
    WHERE b.is_active = true
    UNION
    -- Via direct subcategory_id -> category
    SELECT s.category_id AS cat_id, b.id AS biz_id
    FROM businesses b
    INNER JOIN subcategories s ON s.id = b.subcategory_id
    WHERE b.is_active = true AND b.subcategory_id IS NOT NULL
  ) combined
  GROUP BY cat_id;
$$;
