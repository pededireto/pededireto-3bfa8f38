
CREATE OR REPLACE FUNCTION public.register_business_with_owner(
  p_name text,
  p_slug text,
  p_city text DEFAULT NULL,
  p_cta_phone text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_registration_source text DEFAULT 'manual',
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
SET search_path = public
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

  -- Check if profile exists by user_id (trigger uses random UUID for profiles.id)
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (id, user_id, email, full_name)
    SELECT gen_random_uuid(), v_user_id, email, COALESCE(raw_user_meta_data->>'full_name', '')
    FROM auth.users WHERE id = v_user_id
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_profile_id;
    
    -- If ON CONFLICT hit, fetch the existing id
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
    commercial_status, registration_source
  ) VALUES (
    p_name, p_slug, p_nif, p_address, p_city,
    p_cta_email, p_cta_phone, p_owner_name, p_owner_phone, p_owner_email,
    p_category_id, p_subcategory_id, p_cta_whatsapp, p_cta_website,
    false, 'pending', v_user_id, now(),
    'nao_contactado', p_registration_source
  )
  RETURNING id INTO v_business_id;

  -- Insert business_users using the profiles.id (not auth.uid)
  INSERT INTO public.business_users (business_id, user_id, role)
  VALUES (v_business_id, v_profile_id, 'pending_owner');

  RETURN v_business_id;
END;
$$;
