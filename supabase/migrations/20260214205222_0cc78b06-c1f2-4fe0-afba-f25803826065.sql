
CREATE OR REPLACE FUNCTION public.admin_assign_business_to_user(p_user_id uuid, p_business_id uuid, p_role text DEFAULT 'owner')
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE admin_ok boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) INTO admin_ok;
  IF NOT admin_ok THEN RAISE EXCEPTION 'unauthorized'; END IF;

  INSERT INTO business_users (business_id, user_id, role)
  VALUES (p_business_id, p_user_id, p_role::business_role)
  ON CONFLICT (business_id, user_id) DO UPDATE SET role = p_role::business_role;
END;
$$;
