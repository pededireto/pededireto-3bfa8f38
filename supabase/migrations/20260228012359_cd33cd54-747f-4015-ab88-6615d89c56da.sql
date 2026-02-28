
-- =============================================
-- BLOCO 4: RPCs invite_business_member e remove_business_member
-- =============================================

-- Invite member
CREATE OR REPLACE FUNCTION public.invite_business_member(
  p_business_id uuid,
  p_email text,
  p_role public.business_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_role public.business_role;
  _target_user_id uuid;
  _result jsonb;
BEGIN
  -- Check caller permission
  SELECT role INTO _caller_role
  FROM business_users
  WHERE business_id = p_business_id AND user_id = auth.uid();

  IF _caller_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  -- Only owner and manager can invite
  IF _caller_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Insufficient permissions to invite members';
  END IF;

  -- Manager can only invite staff
  IF _caller_role = 'manager' AND p_role NOT IN ('staff') THEN
    RAISE EXCEPTION 'Managers can only invite staff members';
  END IF;

  -- Find user by email
  SELECT id INTO _target_user_id
  FROM profiles
  WHERE email = p_email;

  IF _target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- Insert into business_users
  INSERT INTO business_users (business_id, user_id, role)
  VALUES (p_business_id, _target_user_id, p_role)
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('success', true, 'user_id', _target_user_id);
END;
$$;

-- Remove member
CREATE OR REPLACE FUNCTION public.remove_business_member(
  p_business_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_role public.business_role;
  _target_role public.business_role;
BEGIN
  -- Check caller permission
  SELECT role INTO _caller_role
  FROM business_users
  WHERE business_id = p_business_id AND user_id = auth.uid();

  IF _caller_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  -- Cannot remove yourself
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  -- Get target role
  SELECT role INTO _target_role
  FROM business_users
  WHERE business_id = p_business_id AND user_id = p_user_id;

  IF _target_role IS NULL THEN
    RAISE EXCEPTION 'User is not a member';
  END IF;

  -- Permission checks
  IF _caller_role = 'owner' THEN
    -- Owner can remove anyone except themselves (already checked)
    NULL;
  ELSIF _caller_role = 'manager' THEN
    -- Manager can only remove staff
    IF _target_role != 'staff' THEN
      RAISE EXCEPTION 'Managers can only remove staff members';
    END IF;
  ELSE
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  DELETE FROM business_users
  WHERE business_id = p_business_id AND user_id = p_user_id;
END;
$$;
