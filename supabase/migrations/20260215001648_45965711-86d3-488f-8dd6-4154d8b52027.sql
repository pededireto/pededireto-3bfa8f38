
-- 1. Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin notifications"
ON public.admin_notifications FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Create server-side RPC for registering a business with owner
-- This replaces direct client-side INSERT into business_users
CREATE OR REPLACE FUNCTION public.register_business_with_owner(
  p_name text,
  p_slug text,
  p_nif text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_cta_email text DEFAULT NULL,
  p_cta_phone text DEFAULT NULL,
  p_owner_name text DEFAULT NULL,
  p_owner_phone text DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_cta_whatsapp text DEFAULT NULL,
  p_cta_website text DEFAULT NULL,
  p_registration_source text DEFAULT 'self_service'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Insert the business
  INSERT INTO public.businesses (
    name, slug, nif, address, city,
    cta_email, cta_phone, owner_name, owner_phone, owner_email,
    category_id, subcategory_id, cta_whatsapp, cta_website,
    is_active, claim_status, claim_requested_by, claim_requested_at,
    commercial_status, registration_source
  ) VALUES (
    p_name, p_slug, p_nif, p_address, p_city,
    p_cta_email, p_cta_phone, p_owner_name, p_owner_phone, p_owner_email,
    p_category_id, p_subcategory_id, p_cta_whatsapp, p_cta_website,
    false, 'pending', v_user_id, now(),
    'nao_contactado', p_registration_source
  )
  RETURNING id INTO v_business_id;

  -- Insert business_users with forced pending_owner role (server-controlled)
  INSERT INTO public.business_users (business_id, user_id, role)
  VALUES (v_business_id, v_user_id, 'pending_owner');

  RETURN v_business_id;
END;
$$;

-- 3. Add RLS policy: authenticated users can only insert business_users for themselves with pending_owner role
-- This is a safety net in case direct inserts are still attempted
CREATE POLICY "Users can self-assign as pending_owner"
ON public.business_users FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'pending_owner'::business_role
);
