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
  p_facebook_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_id   uuid;
  v_business_id   uuid;
  v_final_slug    text;
  v_action        text;
BEGIN
  SELECT id INTO v_existing_id
  FROM public.businesses
  WHERE LOWER(TRIM(name)) = LOWER(TRIM(p_name))
  LIMIT 1;

  v_final_slug := COALESCE(
    p_slug,
    LOWER(REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(p_name),
        '[^a-zA-Z0-9\s]', '', 'g'
      ),
      '\s+', '-', 'g'
    )) || '-' || EXTRACT(EPOCH FROM now())::bigint::text
  );

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.businesses SET
      city           = CASE WHEN p_city          IS NOT NULL AND (city          IS NULL OR city          = '') THEN p_city          ELSE city          END,
      address        = CASE WHEN p_address       IS NOT NULL AND (address       IS NULL OR address       = '') THEN p_address       ELSE address       END,
      cta_email      = CASE WHEN p_cta_email     IS NOT NULL AND (cta_email     IS NULL OR cta_email     = '') THEN p_cta_email     ELSE cta_email     END,
      owner_email    = CASE WHEN p_owner_email   IS NOT NULL AND (owner_email   IS NULL OR owner_email   = '') THEN p_owner_email   ELSE owner_email   END,
      cta_phone      = CASE WHEN p_cta_phone     IS NOT NULL AND (cta_phone     IS NULL OR cta_phone     = '') THEN p_cta_phone     ELSE cta_phone     END,
      cta_whatsapp   = CASE WHEN p_cta_whatsapp  IS NOT NULL AND (cta_whatsapp  IS NULL OR cta_whatsapp  = '') THEN p_cta_whatsapp  ELSE cta_whatsapp  END,
      cta_website    = CASE WHEN p_cta_website   IS NOT NULL AND (cta_website   IS NULL OR cta_website   = '') THEN p_cta_website   ELSE cta_website   END,
      owner_name     = CASE WHEN p_owner_name    IS NOT NULL AND (owner_name    IS NULL OR owner_name    = '') THEN p_owner_name    ELSE owner_name    END,
      owner_phone    = CASE WHEN p_owner_phone   IS NOT NULL AND (owner_phone   IS NULL OR owner_phone   = '') THEN p_owner_phone   ELSE owner_phone   END,
      nif            = CASE WHEN p_nif           IS NOT NULL AND (nif           IS NULL OR nif           = '') THEN p_nif           ELSE nif           END,
      description    = CASE WHEN p_description   IS NOT NULL AND (description   IS NULL OR description   = '') THEN p_description   ELSE description   END,
      instagram_url  = CASE WHEN p_instagram_url IS NOT NULL AND (instagram_url IS NULL OR instagram_url = '') THEN p_instagram_url ELSE instagram_url END,
      facebook_url   = CASE WHEN p_facebook_url  IS NOT NULL AND (facebook_url  IS NULL OR facebook_url  = '') THEN p_facebook_url  ELSE facebook_url  END,
      category_id    = CASE WHEN p_category_id    IS NOT NULL AND category_id    IS NULL THEN p_category_id    ELSE category_id    END,
      subcategory_id = CASE WHEN p_subcategory_id IS NOT NULL AND subcategory_id IS NULL THEN p_subcategory_id ELSE subcategory_id END,
      updated_at     = now()
    WHERE id = v_existing_id;

    v_business_id := v_existing_id;
    v_action      := 'updated';
  ELSE
    INSERT INTO public.businesses (
      name, slug, city, address,
      cta_email, owner_email, cta_phone, cta_whatsapp, cta_website,
      owner_name, owner_phone, nif, description, instagram_url, facebook_url,
      category_id, subcategory_id,
      is_active, claim_status, commercial_status, registration_source
    ) VALUES (
      p_name, v_final_slug, p_city, p_address,
      p_cta_email, p_owner_email, p_cta_phone, p_cta_whatsapp, p_cta_website,
      p_owner_name, p_owner_phone, p_nif, p_description, p_instagram_url, p_facebook_url,
      p_category_id, p_subcategory_id,
      false, 'none', 'nao_contactado', p_registration_source
    )
    RETURNING id INTO v_business_id;

    v_action := 'inserted';
  END IF;

  RETURN jsonb_build_object(
    'id',     v_business_id,
    'action', v_action
  );
END;
$function$