
-- 1. Drop old single-parameter overloads that insert bad notification types
DROP FUNCTION IF EXISTS public.admin_approve_claim(uuid);
DROP FUNCTION IF EXISTS public.admin_revoke_claim(uuid);

-- 2. Drop old admin_reject_claim (uses p_notes instead of p_admin_notes)
DROP FUNCTION IF EXISTS public.admin_reject_claim(uuid, text);

-- 3. Recreate admin_reject_claim with correct param name + audit log + business notification
CREATE OR REPLACE FUNCTION public.admin_reject_claim(
  p_business_id uuid, 
  p_admin_notes text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_claim_user UUID;
  v_business_name TEXT;
  v_previous_status TEXT;
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin only';
  END IF;

  -- Get current data
  SELECT claim_requested_by, name, claim_status 
  INTO v_claim_user, v_business_name, v_previous_status
  FROM businesses 
  WHERE id = p_business_id;

  IF v_claim_user IS NULL THEN
    RAISE EXCEPTION 'No pending claim for this business';
  END IF;

  -- Update business
  UPDATE businesses SET
    claim_status = 'rejected',
    claim_review_notes = p_admin_notes
  WHERE id = p_business_id;

  -- Revoke pending_owner role
  UPDATE business_users SET
    role = 'revoked'
  WHERE business_id = p_business_id 
    AND user_id = v_claim_user 
    AND role = 'pending_owner';

  -- Audit log
  INSERT INTO claim_audit_log (
    business_id, action, previous_status, new_status, 
    performed_by, admin_notes
  ) VALUES (
    p_business_id, 'rejected', v_previous_status, 'rejected',
    auth.uid(), p_admin_notes
  );

  -- Notify user
  INSERT INTO business_notifications (
    business_id, user_id, type, title, message
  ) VALUES (
    p_business_id, v_claim_user, 'system',
    'Claim Rejeitado',
    'O seu pedido de claim para "' || v_business_name || '" foi rejeitado. Motivo: ' || COALESCE(p_admin_notes, 'Sem notas.')
  );

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'status', 'rejected'
  );
END;
$$;

-- 4. Drop old admin_revoke_claim with two params and recreate clean version
DROP FUNCTION IF EXISTS public.admin_revoke_claim(uuid, text);

CREATE OR REPLACE FUNCTION public.admin_revoke_claim(
  p_business_id uuid, 
  p_admin_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_previous_status TEXT;
  v_affected_users UUID[];
  v_business_name TEXT;
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin only';
  END IF;

  SELECT claim_status, name INTO v_previous_status, v_business_name
  FROM businesses WHERE id = p_business_id;

  -- Get affected users
  SELECT array_agg(user_id) INTO v_affected_users
  FROM business_users WHERE business_id = p_business_id;

  -- Update business
  UPDATE businesses SET
    claim_status = 'revoked',
    verified_by = NULL,
    verified_at = NULL
  WHERE id = p_business_id;

  -- Remove all access
  DELETE FROM business_users WHERE business_id = p_business_id;

  -- Audit log
  INSERT INTO claim_audit_log (
    business_id, action, previous_status, new_status,
    performed_by, admin_notes
  ) VALUES (
    p_business_id, 'revoked', v_previous_status, 'revoked',
    auth.uid(), p_admin_notes
  );

  -- Notify affected users
  IF v_affected_users IS NOT NULL THEN
    INSERT INTO business_notifications (
      business_id, user_id, type, title, message
    )
    SELECT 
      p_business_id, 
      u,
      'system',
      'Acesso Revogado',
      'O seu acesso ao negócio "' || v_business_name || '" foi revogado. ' ||
      COALESCE('Motivo: ' || p_admin_notes, '')
    FROM unnest(v_affected_users) AS u;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'status', 'revoked'
  );
END;
$$;

-- 5. Recreate admin_approve_claim (clean, single version with two params)
CREATE OR REPLACE FUNCTION public.admin_approve_claim(
  p_business_id uuid, 
  p_admin_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_claim_user UUID;
  v_business_name TEXT;
  v_previous_status TEXT;
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin only';
  END IF;

  -- Get current data
  SELECT claim_requested_by, name, claim_status 
  INTO v_claim_user, v_business_name, v_previous_status
  FROM businesses 
  WHERE id = p_business_id;

  IF v_claim_user IS NULL THEN
    RAISE EXCEPTION 'No pending claim for this business';
  END IF;

  -- Prevent self-approval
  IF v_claim_user = auth.uid() THEN
    RAISE EXCEPTION 'Cannot approve your own claim';
  END IF;

  -- Update business
  UPDATE businesses SET
    claim_status = 'verified',
    verified_by = auth.uid(),
    verified_at = now()
  WHERE id = p_business_id;

  -- Promote user
  UPDATE business_users SET
    role = 'owner'
  WHERE business_id = p_business_id 
    AND user_id = v_claim_user 
    AND role = 'pending_owner';

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
$$;
