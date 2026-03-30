
CREATE OR REPLACE FUNCTION public.claim_business(p_business_id uuid, p_claim_message text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_status TEXT;
  v_business_name TEXT;
  v_user_id uuid;
  v_profile_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure profile exists (handles race condition for new signups)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
  IF NOT v_profile_exists THEN
    INSERT INTO public.profiles (id, user_id, email, full_name)
    SELECT v_user_id, v_user_id, raw_user_meta_data->>'email', COALESCE(raw_user_meta_data->>'full_name', '')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT claim_status, name INTO v_current_status, v_business_name
  FROM businesses WHERE id = p_business_id;

  IF v_current_status NOT IN ('unclaimed', 'none', 'rejected') THEN
    RAISE EXCEPTION 'Business already claimed or pending';
  END IF;

  UPDATE businesses SET
    claim_status = 'preview',
    claim_requested_by = v_user_id,
    claim_requested_at = now(),
    claimed = true,
    claimed_at = now(),
    claimed_by = v_user_id
  WHERE id = p_business_id;

  INSERT INTO business_users (business_id, user_id, role)
  VALUES (p_business_id, v_user_id, 'pending_owner')
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
$$;
