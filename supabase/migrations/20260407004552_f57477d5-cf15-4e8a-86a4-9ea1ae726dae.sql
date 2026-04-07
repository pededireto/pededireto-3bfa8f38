-- Drop the overly restrictive business_users update policy
DROP POLICY IF EXISTS "business_users_update_matches" ON public.request_business_matches;

-- Recreate with broader role support (owner OR pending_owner)
CREATE POLICY "business_users_update_matches"
ON public.request_business_matches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = request_business_matches.business_id
      AND bu.user_id = get_my_profile_id()
      AND bu.role IN ('owner', 'pending_owner')
  )
);

-- Also fix the owner_email-based policy to also check owner_id
DROP POLICY IF EXISTS "Businesses can update own matches" ON public.request_business_matches;

CREATE POLICY "Businesses can update own matches"
ON public.request_business_matches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = request_business_matches.business_id
      AND (
        -- Match by owner_id
        b.owner_id = auth.uid()
        OR
        -- Match by owner_email via profiles
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.email = b.owner_email
            AND p.user_id = auth.uid()
        )
        OR
        -- Match by claimed_by
        b.claimed_by = auth.uid()
      )
  )
);