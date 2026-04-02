
-- PROBLEM 1: Drop BOTH overloaded functions and recreate one clean version
DROP FUNCTION IF EXISTS public.register_business_with_owner(text,text,text,text,text,text,text,text,text,text,uuid,uuid,text,text,text);
DROP FUNCTION IF EXISTS public.register_business_with_owner(text,text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,text);

-- Recreate single clean version
CREATE OR REPLACE FUNCTION public.register_business_with_owner(
  p_name text,
  p_slug text,
  p_city text DEFAULT NULL,
  p_cta_phone text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_registration_source text DEFAULT 'self_service',
  p_nif text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_cta_email text DEFAULT NULL,
  p_owner_name text DEFAULT NULL,
  p_owner_phone text DEFAULT NULL,
  p_cta_whatsapp text DEFAULT NULL,
  p_cta_website text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_profile_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Resolve profiles.id (FK target for business_users)
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (id, user_id, email, full_name)
    SELECT gen_random_uuid(), v_user_id, email, COALESCE(raw_user_meta_data->>'full_name', '')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_profile_id;
    
    IF v_profile_id IS NULL THEN
      SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;
    END IF;
  END IF;

  -- Insert the business
  INSERT INTO public.businesses (
    name, slug, nif, address, city,
    cta_email, cta_phone, owner_name, owner_phone, owner_email,
    category_id, subcategory_id, cta_whatsapp, cta_website,
    is_active, claim_status, claim_requested_by, claim_requested_at,
    commercial_status, registration_source, owner_id
  ) VALUES (
    p_name, p_slug, p_nif, p_address, p_city,
    p_cta_email, p_cta_phone, p_owner_name, p_owner_phone, p_owner_email,
    p_category_id, p_subcategory_id, p_cta_whatsapp, p_cta_website,
    false, 'pending', v_user_id, now(),
    'nao_contactado', p_registration_source, v_user_id
  )
  RETURNING id INTO v_business_id;

  -- Insert business_users using profiles.id
  INSERT INTO public.business_users (business_id, user_id, role)
  VALUES (v_business_id, v_profile_id, 'pending_owner');

  RETURN v_business_id;
END;
$$;

-- PROBLEM 2: Fix RLS on business_users — use get_my_profile_id() instead of auth.uid()
DROP POLICY IF EXISTS "Users view own memberships" ON public.business_users;
CREATE POLICY "Users view own memberships"
  ON public.business_users
  FOR SELECT
  USING (user_id = get_my_profile_id());

-- Also fix the insert policy
DROP POLICY IF EXISTS "insert_business_users" ON public.business_users;
CREATE POLICY "insert_business_users"
  ON public.business_users
  FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role, 'onboarding'::app_role, 'cs'::app_role])
    ))
    OR (user_id = get_my_profile_id() AND role = 'pending_owner'::business_role)
  );

-- Fix the update policy too
DROP POLICY IF EXISTS "update_business_users" ON public.business_users;
CREATE POLICY "update_business_users"
  ON public.business_users
  FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role, 'onboarding'::app_role, 'cs'::app_role])
    ))
    OR user_id = get_my_profile_id()
  );
