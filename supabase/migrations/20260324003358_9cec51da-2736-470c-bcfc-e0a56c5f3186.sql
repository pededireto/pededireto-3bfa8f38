-- Add opening_hours column to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT NULL;

-- Drop the old overloaded versions of the RPC
DROP FUNCTION IF EXISTS public.upsert_business_from_import(text, text, text, text, text, text, text, text, text, text, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.upsert_business_from_import(text, text, text, text, text, text, text, text, text, text, text, uuid, uuid, text, text, text, text, text);

-- Recreate with ALL fields
CREATE OR REPLACE FUNCTION public.upsert_business_from_import(
  p_name text,
  p_slug text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_cta_email text DEFAULT NULL,
  p_owner_email text DEFAULT NULL,
  p_cta_phone text DEFAULT NULL,
  p_cta_whatsapp text DEFAULT NULL,
  p_cta_website text DEFAULT NULL,
  p_owner_name text DEFAULT NULL,
  p_owner_phone text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_subcategory_id uuid DEFAULT NULL,
  p_registration_source text DEFAULT 'import',
  p_nif text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL,
  p_facebook_url text DEFAULT NULL,
  p_other_social_url text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_opening_hours jsonb DEFAULT NULL,
  p_cta_booking_url text DEFAULT NULL,
  p_cta_order_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_slug text;
  v_action text := 'inserted';
BEGIN
  v_slug := COALESCE(p_slug, lower(regexp_replace(
    regexp_replace(
      translate(p_name, 'àáâãäéèêëíìîïóòôõöúùûüçñÀÁÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
                        'aaaaaeeeeiiiioooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'),
      '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g')));

  SELECT id INTO v_id FROM businesses WHERE lower(trim(name)) = lower(trim(p_name)) LIMIT 1;

  IF v_id IS NOT NULL THEN
    v_action := 'updated';
    UPDATE businesses SET
      city = COALESCE(p_city, city),
      address = COALESCE(p_address, address),
      cta_email = COALESCE(p_cta_email, cta_email),
      owner_email = COALESCE(p_owner_email, owner_email),
      cta_phone = COALESCE(p_cta_phone, cta_phone),
      cta_whatsapp = COALESCE(p_cta_whatsapp, cta_whatsapp),
      cta_website = COALESCE(p_cta_website, cta_website),
      owner_name = COALESCE(p_owner_name, owner_name),
      owner_phone = COALESCE(p_owner_phone, owner_phone),
      category_id = COALESCE(p_category_id, category_id),
      subcategory_id = COALESCE(p_subcategory_id, subcategory_id),
      nif = COALESCE(p_nif, nif),
      description = COALESCE(p_description, description),
      instagram_url = COALESCE(p_instagram_url, instagram_url),
      facebook_url = COALESCE(p_facebook_url, facebook_url),
      other_social_url = COALESCE(p_other_social_url, other_social_url),
      logo_url = COALESCE(p_logo_url, logo_url),
      opening_hours = COALESCE(p_opening_hours, opening_hours),
      cta_booking_url = COALESCE(p_cta_booking_url, cta_booking_url),
      cta_order_url = COALESCE(p_cta_order_url, cta_order_url),
      updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO businesses (
      name, slug, city, address, cta_email, owner_email, cta_phone, cta_whatsapp,
      cta_website, owner_name, owner_phone, category_id, subcategory_id,
      registration_source, nif, description, instagram_url, facebook_url,
      other_social_url, logo_url, opening_hours, cta_booking_url, cta_order_url,
      is_active
    ) VALUES (
      trim(p_name), v_slug, p_city, p_address, p_cta_email, p_owner_email,
      p_cta_phone, p_cta_whatsapp, p_cta_website, p_owner_name, p_owner_phone,
      p_category_id, p_subcategory_id, p_registration_source, p_nif, p_description,
      p_instagram_url, p_facebook_url, p_other_social_url, p_logo_url, p_opening_hours,
      p_cta_booking_url, p_cta_order_url, false
    ) RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('id', v_id, 'action', v_action);
END;
$$;