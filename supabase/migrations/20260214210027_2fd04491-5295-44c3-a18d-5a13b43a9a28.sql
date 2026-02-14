
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text := 'user';
  v_business_id uuid;
  v_business_count int := 0;
  v_pending_count int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('role','user','business_id',null,'business_count',0,'pending_count',0);
  END IF;

  -- Get highest role
  SELECT ur.role INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = v_user_id
  ORDER BY CASE ur.role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'comercial' THEN 3
    WHEN 'cs' THEN 4
    WHEN 'onboarding' THEN 5
    WHEN 'business_owner' THEN 6
    WHEN 'user' THEN 7
    ELSE 8
  END
  LIMIT 1;

  -- Primary business
  SELECT bu.business_id INTO v_business_id
  FROM business_users bu
  WHERE bu.user_id = v_user_id AND bu.role IN ('owner','pending_owner')
  ORDER BY bu.created_at ASC
  LIMIT 1;

  -- Counts
  SELECT COUNT(*) INTO v_business_count
  FROM business_users WHERE user_id = v_user_id AND role IN ('owner','pending_owner');

  SELECT COUNT(*) INTO v_pending_count
  FROM businesses WHERE claim_requested_by = v_user_id AND claim_status = 'pending';

  RETURN jsonb_build_object(
    'role', COALESCE(v_role, 'user'),
    'business_id', v_business_id,
    'business_count', COALESCE(v_business_count, 0),
    'pending_count', COALESCE(v_pending_count, 0)
  );
END;
$$;
