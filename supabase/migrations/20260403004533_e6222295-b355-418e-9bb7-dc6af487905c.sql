
CREATE OR REPLACE FUNCTION public.admin_approve_claim(p_business_id uuid, p_admin_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_claim_user UUID;
  v_business_name TEXT;
  v_previous_status TEXT;
  v_profile_id UUID;
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin only'
    );
  END IF;

  -- Get current data
  SELECT claim_requested_by, name, claim_status
  INTO v_claim_user, v_business_name, v_previous_status
  FROM businesses
  WHERE id = p_business_id;

  IF v_claim_user IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhum claim pendente para este negócio'
    );
  END IF;

  -- Prevent self-approval
  IF v_claim_user = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não pode aprovar o seu próprio claim'
    );
  END IF;

  -- Resolve profiles.id from auth UUID
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_claim_user;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil não encontrado para este utilizador (auth_uid: ' || v_claim_user::text || ')'
    );
  END IF;

  -- Update business
  UPDATE businesses SET
    claim_status = 'verified',
    verified_by = auth.uid(),
    verified_at = now()
  WHERE id = p_business_id;

  -- Promote user: try UPDATE first (using profile_id, not auth_uid)
  UPDATE business_users SET
    role = 'owner'
  WHERE business_id = p_business_id
    AND user_id = v_profile_id
    AND role = 'pending_owner';

  -- If no pending_owner row existed, create the owner row directly
  IF NOT FOUND THEN
    INSERT INTO business_users (business_id, user_id, role)
    VALUES (p_business_id, v_profile_id, 'owner')
    ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'owner';
  END IF;

  -- Audit log
  INSERT INTO claim_audit_log (
    business_id, action, previous_status, new_status,
    performed_by, admin_notes
  ) VALUES (
    p_business_id, 'approved', v_previous_status, 'verified',
    auth.uid(), p_admin_notes
  );

  -- Notify user
  INSERT INTO business_notifications (
    business_id, user_id, type, title, message
  ) VALUES (
    p_business_id, v_claim_user, 'system',
    'Negócio Aprovado',
    'O seu pedido de claim para "' || v_business_name || '" foi aprovado. Já pode gerir o seu negócio.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'status', 'verified'
  );
END;
$function$;
