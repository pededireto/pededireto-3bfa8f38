
-- Drop the old single-param overload that conflicts
DROP FUNCTION IF EXISTS public.claim_business(uuid);

-- Keep only the two-param version (p_business_id, p_claim_message)
-- which follows the correct pending→verified lifecycle
