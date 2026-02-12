
-- Fix 1: Add authorization check to match_request_to_businesses
-- Ensures only the request owner (or admin) can trigger matching
CREATE OR REPLACE FUNCTION public.match_request_to_businesses(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
  v_matched RECORD;
BEGIN
  -- Authorization: verify caller owns the request or is admin
  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Check ownership via profiles.user_id or admin role
  IF v_request.user_id != auth.uid() 
     AND NOT public.has_role(auth.uid(), 'admin') 
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: not your request';
  END IF;

  -- Find matching businesses (active, paying, same category, same city if available)
  FOR v_matched IN
    SELECT b.id
    FROM businesses b
    WHERE b.is_active = true
      AND b.subscription_status = 'active'
      AND (v_request.category_id IS NULL OR b.category_id = v_request.category_id)
      AND (
        v_request.location_city IS NULL 
        OR v_request.location_city = '' 
        OR lower(b.city) = lower(v_request.location_city)
      )
      AND NOT EXISTS (
        SELECT 1 FROM request_business_matches rbm
        WHERE rbm.request_id = p_request_id AND rbm.business_id = b.id
      )
    ORDER BY
      CASE b.premium_level
        WHEN 'super_destaque' THEN 1
        WHEN 'destaque' THEN 2
        ELSE 3
      END,
      CASE b.subscription_plan
        WHEN 'premium' THEN 1
        WHEN 'professional' THEN 2
        ELSE 3
      END
    LIMIT 3
  LOOP
    INSERT INTO request_business_matches (request_id, business_id, status)
    VALUES (p_request_id, v_matched.id, 'enviado');

    INSERT INTO business_notifications (business_id, title, message, type)
    VALUES (
      v_matched.id,
      'Novo pedido de serviço',
      'Recebeu um novo pedido na sua categoria. Verifique os detalhes.',
      'lead'
    );
  END LOOP;
END;
$$;

-- Fix 2: Drop old email-based RLS policies on request_business_matches
-- and replace with user_id-based ownership via businesses table
DROP POLICY IF EXISTS "Businesses can view own matches" ON public.request_business_matches;
DROP POLICY IF EXISTS "Businesses can update own matches" ON public.request_business_matches;

-- New policy: businesses can view matches where they own the business (via auth.uid matching profiles)
CREATE POLICY "Businesses can view own matches"
  ON public.request_business_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.email = b.owner_email
      WHERE b.id = request_business_matches.business_id
        AND p.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Businesses can update own matches"
  ON public.request_business_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.email = b.owner_email
      WHERE b.id = request_business_matches.business_id
        AND p.user_id = auth.uid()
    )
  );
