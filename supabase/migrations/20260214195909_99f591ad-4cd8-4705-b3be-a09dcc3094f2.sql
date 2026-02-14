
DROP FUNCTION IF EXISTS public.admin_remove_business_from_user(uuid, uuid);

CREATE OR REPLACE FUNCTION public.admin_remove_business_from_user(p_business_id uuid, p_user_id uuid)
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

  UPDATE business_users
  SET role = 'revoked'
  WHERE business_id = p_business_id AND user_id = p_user_id;
END;
$$;
