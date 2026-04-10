-- =================================================================
-- FIX 1: check_and_award_automatic_badges — v_stats.favorites_count crash
-- The record v_stats only has (total_reviews, average_rating) fields.
-- Using v_stats.favorites_count fails because the field doesn't exist.
-- Fix: use separate variables for favorites_count and views_total.
-- =================================================================
CREATE OR REPLACE FUNCTION public.check_and_award_automatic_badges(bid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge record;
  v_awarded integer := 0;
  v_total_reviews integer := 0;
  v_average_rating numeric := 0;
  v_favorites integer := 0;
  v_views_total integer := 0;
  v_business record;
  v_avg_resp_hours numeric;
  v_total_matches integer;
  v_accepted_matches integer;
  v_clicks_month integer;
  v_total_requests integer;
BEGIN
  SELECT claim_status, created_at, subscription_start_date, description, logo_url, schedule_weekdays, city
    INTO v_business
    FROM public.businesses
    WHERE id = bid;

  SELECT COALESCE(total_reviews, 0), COALESCE(average_rating, 0)
    INTO v_total_reviews, v_average_rating
    FROM public.business_review_stats
    WHERE business_id = bid;

  SELECT COALESCE(favorites_count, 0), COALESCE(views_total, 0)
    INTO v_favorites, v_views_total
    FROM public.business_analytics_metrics
    WHERE business_id = bid;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'aceite')
    INTO v_total_matches, v_accepted_matches
    FROM public.request_business_matches
    WHERE business_id = bid;

  v_total_requests := v_total_matches;

  SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - sent_at)) / 3600.0)
    INTO v_avg_resp_hours
    FROM public.request_business_matches
    WHERE business_id = bid
      AND first_response_at IS NOT NULL;

  SELECT COUNT(*)
    INTO v_clicks_month
    FROM public.analytics_events
    WHERE business_id = bid
      AND event_type LIKE 'click_%'
      AND created_at >= date_trunc('month', now());

  FOR v_badge IN
    SELECT * FROM public.business_badges WHERE is_automatic = true AND is_active = true
  LOOP
    DECLARE
      v_qualifies boolean := false;
    BEGIN
      CASE v_badge.slug
        WHEN 'top-rated' THEN
          v_qualifies := v_total_reviews >= COALESCE((v_badge.criteria->>'min_reviews')::integer, 10)
                     AND v_average_rating >= COALESCE((v_badge.criteria->>'min_rating')::numeric, 4.5);
        WHEN 'super-avaliado' THEN
          v_qualifies := v_total_reviews >= COALESCE((v_badge.criteria->>'min_reviews')::integer, 25)
                     AND v_average_rating >= COALESCE((v_badge.criteria->>'min_rating')::numeric, 4.8);
        WHEN 'local-favorite' THEN
          v_qualifies := v_favorites >= COALESCE((v_badge.criteria->>'min_favorites')::integer, 50);
        WHEN 'quick-response' THEN
          v_qualifies := v_avg_resp_hours IS NOT NULL
                     AND v_avg_resp_hours <= COALESCE((v_badge.criteria->>'avg_response_time_hours')::numeric, 2);
        WHEN 'primeiro-passo' THEN
          v_qualifies := v_business.description IS NOT NULL AND length(trim(v_business.description)) > 50
                     AND v_business.logo_url IS NOT NULL
                     AND v_business.schedule_weekdays IS NOT NULL
                     AND v_business.city IS NOT NULL;
        WHEN 'primeiro-olhar' THEN
          v_qualifies := COALESCE(v_views_total, 0) >= COALESCE((v_badge.criteria->>'target')::integer, 10);
        WHEN 'primeira-fasica' THEN
          v_qualifies := v_total_requests >= 1;
        WHEN 'em-chamas' THEN
          v_qualifies := v_clicks_month >= COALESCE((v_badge.criteria->>'target')::integer, 10);
        WHEN 'muito-solicitado' THEN
          v_qualifies := v_total_requests >= COALESCE((v_badge.criteria->>'target')::integer, 50);
        WHEN 'top-resposta' THEN
          v_qualifies := v_total_matches >= COALESCE((v_badge.criteria->>'min_matches')::integer, 10)
                     AND (v_accepted_matches::numeric / NULLIF(v_total_matches, 0) * 100) >= COALESCE((v_badge.criteria->>'min_rate')::integer, 80);
        ELSE
          v_qualifies := false;
      END CASE;

      IF v_qualifies THEN
        INSERT INTO public.business_earned_badges (business_id, badge_id, earned_automatically)
        VALUES (bid, v_badge.id, true)
        ON CONFLICT (business_id, badge_id) DO NOTHING;

        IF FOUND THEN
          v_awarded := v_awarded + 1;
        END IF;
      END IF;
    END;
  END LOOP;

  RETURN v_awarded;
END;
$$;

-- =================================================================
-- FIX 2: register_affiliate_business — is_verified → is_active
-- =================================================================
CREATE OR REPLACE FUNCTION public.register_affiliate_business(
  p_name text,
  p_slug text,
  p_city text,
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
  p_logo_url text DEFAULT NULL,
  p_affiliate_id uuid DEFAULT NULL
)
RETURNS json
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
    subscription_status, registration_source, is_active, logo_url
  ) VALUES (
    p_name, p_slug, p_city, p_cta_phone, p_cta_email, p_cta_website,
    p_category_id, p_subcategory_id, p_description, p_public_address,
    p_schedule_weekdays, p_schedule_weekend, p_instagram_url, p_facebook_url,
    p_other_social_url, p_owner_name, p_owner_phone, p_owner_email, p_nif,
    'inactive', 'affiliate', false, p_logo_url
  )
  RETURNING id INTO v_business_id;

  IF p_affiliate_id IS NOT NULL THEN
    INSERT INTO affiliate_leads (
      affiliate_id, business_id, business_name, city,
      contact_phone, contact_email, contact_website, notes, source
    ) VALUES (
      p_affiliate_id, v_business_id, p_name, p_city,
      COALESCE(p_cta_phone, p_owner_phone), COALESCE(p_cta_email, p_owner_email),
      p_cta_website, p_notes, 'form'
    )
    RETURNING id INTO v_lead_id;
  END IF;

  RETURN json_build_object('business_id', v_business_id, 'lead_id', v_lead_id);
END;
$$;

-- =================================================================
-- FIX 3: Trigger — alert admin when new service request is created
-- =================================================================
CREATE OR REPLACE FUNCTION public.trg_alert_new_service_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_name text;
  v_consumer_name text;
BEGIN
  SELECT name INTO v_sub_name FROM public.subcategories WHERE id = NEW.subcategory_id;
  SELECT full_name INTO v_consumer_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  VALUES (
    'new_service_request',
    'Novo pedido — ' || COALESCE(v_sub_name, 'Sem categoria') || COALESCE(' em ' || NEW.location_city, ''),
    'Novo pedido de ' || COALESCE(v_consumer_name, 'consumidor') || ': ' || LEFT(COALESCE(NEW.description, ''), 100),
    'info',
    'request',
    'service_request',
    NEW.id,
    '/admin?tab=service-requests'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_new_service_request ON public.service_requests;
CREATE TRIGGER trg_alert_new_service_request
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_alert_new_service_request();

-- =================================================================
-- FIX 4: Trigger — notify business when it receives a new match
-- (ensures business_notifications is populated even outside
--  match_request_to_businesses, e.g. manual admin matches)
-- =================================================================
CREATE OR REPLACE FUNCTION public.trg_notify_business_new_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_description text;
  v_city text;
BEGIN
  IF NEW.status = 'enviado' THEN
    SELECT sr.description, sr.location_city
      INTO v_description, v_city
      FROM public.service_requests sr
      WHERE sr.id = NEW.request_id;

    INSERT INTO public.business_notifications (business_id, title, message, type)
    VALUES (
      NEW.business_id,
      'Novo pedido de serviço',
      'Recebeu um novo pedido' || COALESCE(' em ' || v_city, '') || '. Verifique os detalhes.',
      'lead'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_business_new_match ON public.request_business_matches;
CREATE TRIGGER trg_notify_business_new_match
  AFTER INSERT ON public.request_business_matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_business_new_match();