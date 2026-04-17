DROP POLICY IF EXISTS "Owner can manage own business subcategories" ON public.business_subcategories;

CREATE POLICY "Owners and pending owners can manage own business subcategories"
ON public.business_subcategories
FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT bu.business_id
    FROM public.business_users bu
    WHERE bu.user_id = public.get_my_profile_id()
      AND bu.role = ANY (ARRAY['owner'::public.business_role, 'pending_owner'::public.business_role, 'manager'::public.business_role])
  )
)
WITH CHECK (
  business_id IN (
    SELECT bu.business_id
    FROM public.business_users bu
    WHERE bu.user_id = public.get_my_profile_id()
      AND bu.role = ANY (ARRAY['owner'::public.business_role, 'pending_owner'::public.business_role, 'manager'::public.business_role])
  )
);