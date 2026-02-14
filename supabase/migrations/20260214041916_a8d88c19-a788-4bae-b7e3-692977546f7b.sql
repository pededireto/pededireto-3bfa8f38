
-- 1. Add claim_review_notes to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS claim_review_notes text;

-- 2. Add 'revoked' to business_role enum
ALTER TYPE public.business_role ADD VALUE IF NOT EXISTS 'revoked';

-- 3. Add user_id to business_notifications (nullable, for claim notifications)
ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 4. RPC: update_business_limited (pending or verified can edit phone/website/description)
CREATE OR REPLACE FUNCTION public.update_business_limited(
  p_business_id uuid,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Check user has access to this business
  IF NOT EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id AND user_id = v_user_id
    AND role IN ('owner', 'pending_owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: no access to this business';
  END IF;

  SELECT claim_status INTO v_status FROM businesses WHERE id = p_business_id;

  IF v_status NOT IN ('pending', 'verified') THEN
    RAISE EXCEPTION 'Cannot edit: claim status is %', v_status;
  END IF;

  UPDATE businesses SET
    cta_phone = COALESCE(p_phone, cta_phone),
    cta_website = COALESCE(p_website, cta_website),
    description = COALESCE(p_description, description),
    updated_at = now()
  WHERE id = p_business_id;
END;
$$;

-- 5. RPC: update_business_full (verified owners with paid plan)
CREATE OR REPLACE FUNCTION public.update_business_full(
  p_business_id uuid,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL,
  p_facebook text DEFAULT NULL,
  p_instagram text DEFAULT NULL,
  p_other_social text DEFAULT NULL,
  p_schedule_weekdays text DEFAULT NULL,
  p_schedule_weekend text DEFAULT NULL,
  p_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
  v_role business_role;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT bu.role INTO v_role
  FROM business_users bu
  WHERE bu.business_id = p_business_id AND bu.user_id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized: must be owner or manager';
  END IF;

  SELECT claim_status INTO v_status FROM businesses WHERE id = p_business_id;

  IF v_status != 'verified' THEN
    RAISE EXCEPTION 'Cannot edit: claim not verified';
  END IF;

  UPDATE businesses SET
    cta_phone = COALESCE(p_phone, cta_phone),
    cta_website = COALESCE(p_website, cta_website),
    description = COALESCE(p_description, description),
    cta_email = COALESCE(p_email, cta_email),
    cta_whatsapp = COALESCE(p_whatsapp, cta_whatsapp),
    facebook_url = COALESCE(p_facebook, facebook_url),
    instagram_url = COALESCE(p_instagram, instagram_url),
    other_social_url = COALESCE(p_other_social, other_social_url),
    schedule_weekdays = COALESCE(p_schedule_weekdays, schedule_weekdays),
    schedule_weekend = COALESCE(p_schedule_weekend, schedule_weekend),
    address = COALESCE(p_address, address),
    updated_at = now()
  WHERE id = p_business_id;
END;
$$;
