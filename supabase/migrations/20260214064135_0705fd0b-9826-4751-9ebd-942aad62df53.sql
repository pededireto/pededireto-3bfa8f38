
-- 1. Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Business members can view their own business" ON businesses;

-- 2. Create SECURITY DEFINER function to bypass RLS on business_users
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
  )
$$;

-- 3. Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_business_member FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_member TO authenticated;

-- 4. Recreate policy using the safe function
CREATE POLICY "Business members can view their own business"
ON businesses FOR SELECT TO authenticated
USING (public.is_business_member(id));
