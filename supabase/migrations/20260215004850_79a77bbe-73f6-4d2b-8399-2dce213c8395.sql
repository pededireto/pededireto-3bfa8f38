
-- 1. Fix admin_approve_claim: add INSERT fallback when UPDATE matches 0 rows
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

  -- Promote user: try UPDATE first
  UPDATE business_users SET
    role = 'owner'
  WHERE business_id = p_business_id 
    AND user_id = v_claim_user 
    AND role = 'pending_owner';

  -- If no pending_owner row existed, create the owner row directly
  IF NOT FOUND THEN
    INSERT INTO business_users (business_id, user_id, role)
    VALUES (p_business_id, v_claim_user, 'owner')
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

-- 2. Fix existing data: insert missing business_users row for Sanipol
INSERT INTO business_users (business_id, user_id, role)
SELECT 
  b.id,
  b.claim_requested_by,
  'owner'::business_role
FROM businesses b
WHERE b.id = '5adab599-3181-4eb8-8d80-37ca18bc3a44'
  AND b.claim_status = 'verified'
  AND b.claim_requested_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM business_users bu 
    WHERE bu.business_id = b.id AND bu.user_id = b.claim_requested_by
  );
