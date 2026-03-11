
DROP FUNCTION IF EXISTS public.create_affiliate_lead_with_business(uuid,text,text,text,text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS public.create_affiliate_lead_with_business(uuid,text,text,text,text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.create_affiliate_lead_with_business(
  p_affiliate_id uuid,
  p_name text,
  p_slug text,
  p_city text DEFAULT NULL,
  p_cta_phone text DEFAULT NULL,
  p_cta_email text DEFAULT NULL,
  p_cta_website text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_public_address text DEFAULT NULL,
  p_schedule_weekdays text DEFAULT NULL,
  p_schedule_weekend text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL,
  p_facebook_url text DEFAULT NULL,
  p_other_social_url text DEFAULT NULL,
  p_owner_name text DEFAULT NULL,
  p_owner_phone text DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_nif text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_lead_id uuid;
BEGIN
  INSERT INTO businesses (
    name, slug, city, cta_phone, cta_email, cta_website,
    category_id, subcategory_id, description, public_address,
    schedule_weekdays, schedule_weekend, instagram_url, facebook_url,
    other_social_url, owner_name, owner_phone, owner_email, nif,
    status, source, is_verified, logo_url
  ) VALUES (
    p_name, p_slug, p_city, p_cta_phone, p_cta_email, p_cta_website,
    p_category_id, p_subcategory_id, p_description, p_public_address,
    p_schedule_weekdays, p_schedule_weekend, p_instagram_url, p_facebook_url,
    p_other_social_url, p_owner_name, p_owner_phone, p_owner_email, p_nif,
    'inactive', 'affiliate', false, p_logo_url
  )
  RETURNING id INTO v_business_id;

  INSERT INTO affiliate_leads (
    affiliate_id, business_id, business_name, city,
    contact_phone, contact_email, contact_website, notes, source
  ) VALUES (
    p_affiliate_id, v_business_id, p_name, p_city,
    COALESCE(p_cta_phone, p_owner_phone), COALESCE(p_cta_email, p_owner_email),
    p_cta_website, p_notes, 'form'
  )
  RETURNING id INTO v_lead_id;

  IF p_cta_phone IS NOT NULL OR p_owner_phone IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'phone', COALESCE(p_cta_phone, p_owner_phone));
  END IF;

  IF p_cta_email IS NOT NULL OR p_owner_email IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'email', COALESCE(p_cta_email, p_owner_email));
  END IF;

  IF p_cta_website IS NOT NULL THEN
    INSERT INTO affiliate_lead_fingerprints (lead_id, field_type, field_value)
    VALUES (v_lead_id, 'website', p_cta_website);
  END IF;

  RETURN v_lead_id;
END;
$$;
