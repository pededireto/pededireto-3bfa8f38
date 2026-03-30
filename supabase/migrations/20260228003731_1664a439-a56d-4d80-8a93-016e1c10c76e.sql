
-- PEÇA 1A: Atualizar claim_business para usar 'preview' em vez de 'pending'
CREATE OR REPLACE FUNCTION public.claim_business(p_business_id uuid, p_claim_message text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_status TEXT;
  v_business_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT claim_status, name INTO v_current_status, v_business_name
  FROM businesses WHERE id = p_business_id;

  IF v_current_status NOT IN ('unclaimed', 'none', 'rejected') THEN
    RAISE EXCEPTION 'Business already claimed or pending';
  END IF;

  UPDATE businesses SET
    claim_status = 'preview',
    claim_requested_by = auth.uid(),
    claim_requested_at = now(),
    claimed = true,
    claimed_at = now(),
    claimed_by = auth.uid()
  WHERE id = p_business_id;

  INSERT INTO business_users (business_id, user_id, role)
  VALUES (p_business_id, auth.uid(), 'pending_owner')
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET role = 'pending_owner';

  INSERT INTO business_notifications (business_id, type, title, message)
  VALUES (
    p_business_id,
    'new_claim_request',
    'Novo Pedido de Claim',
    'Utilizador solicitou claim de "' || v_business_name || '"'
  );

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'status', 'preview'
  );
END;
$function$;

-- PEÇA 1B: Atualizar search para incluir negócios com claim_status 'none'
CREATE OR REPLACE FUNCTION public.search_businesses_for_claim(p_query text, p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, name text, city text, category_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF length(p_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.city,
    b.category_id
  FROM businesses b
  WHERE 
    b.claim_status IN ('unclaimed', 'none', 'rejected')
    AND b.name ILIKE '%' || p_query || '%'
  ORDER BY 
    similarity(b.name, p_query) DESC,
    b.name ASC
  LIMIT p_limit;
END;
$function$;
