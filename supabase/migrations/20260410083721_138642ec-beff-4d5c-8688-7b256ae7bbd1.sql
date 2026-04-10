CREATE OR REPLACE FUNCTION public.trg_alert_all_rejected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_rejected int;
  v_request record;
BEGIN
  IF NEW.status = 'recusado' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'recusado')
      INTO v_total, v_rejected
      FROM public.request_business_matches
      WHERE request_id = NEW.request_id;

    IF v_total > 0 AND v_total = v_rejected THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_alerts
        WHERE entity_type = 'service_request'
          AND entity_id = NEW.request_id
          AND type = 'all_rejected'
          AND resolved_at IS NULL
      ) THEN
        SELECT sr.location_city, COALESCE(s.name, 'N/A') AS sub_name
          INTO v_request
          FROM public.service_requests sr
          LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
          WHERE sr.id = NEW.request_id;

        INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
        VALUES (
          'all_rejected',
          'Todos recusaram — ' || COALESCE(v_request.sub_name, '') || COALESCE(' em ' || v_request.location_city, ''),
          'Todos os negócios recusaram este pedido. Intervenção manual necessária.',
          'critical',
          'request',
          'service_request',
          NEW.request_id,
          '/admin?tab=service-requests'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_log_consumer_match_accepted_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_biz_name text;
BEGIN
  IF NEW.status = 'aceite' AND OLD.status IS DISTINCT FROM 'aceite' THEN
    SELECT sr.user_id INTO v_user_id
    FROM public.service_requests sr
    WHERE sr.id = NEW.request_id;

    SELECT b.name INTO v_biz_name
    FROM public.businesses b
    WHERE b.id = NEW.business_id;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.consumer_activity_log (user_id, event_type, title, description, icon, entity_id, entity_type)
      VALUES (
        v_user_id,
        'match_accepted',
        'Negócio aceitou o seu pedido',
        COALESCE(v_biz_name, 'Um profissional') || ' respondeu ao seu pedido.',
        'check-circle',
        NEW.request_id,
        'service_request'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_consumer_on_match_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_business_name text;
BEGIN
  IF NEW.status = 'aceite' AND (OLD.status IS NULL OR OLD.status <> 'aceite') THEN
    SELECT id, user_id, description
      INTO v_request
      FROM public.service_requests
      WHERE id = NEW.request_id;

    SELECT name INTO v_business_name
    FROM public.businesses
    WHERE id = NEW.business_id;

    IF v_request.user_id IS NOT NULL THEN
      INSERT INTO public.user_notifications (user_id, title, message, type, action_url, is_read)
      VALUES (
        v_request.user_id,
        COALESCE(v_business_name, 'Um profissional') || ' aceitou o seu pedido!',
        'O profissional aceitou o seu pedido e está pronto para ajudar.',
        'request_accepted',
        '/pedido/' || NEW.request_id,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_unanswered_24h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT
    'unanswered_24h',
    'Pedido sem resposta 24h — ' || COALESCE(s.name, 'N/A') || COALESCE(' em ' || sr.location_city, ''),
    'Este pedido não recebeu nenhuma resposta aceite nas últimas 24 horas.',
    'important',
    'request',
    'service_request',
    sr.id,
    '/admin?tab=service-requests'
  FROM public.service_requests sr
  LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
  WHERE sr.created_at < now() - interval '24 hours'
    AND sr.status IN ('aberto', 'em_conversa')
    AND NOT EXISTS (
      SELECT 1
      FROM public.request_business_matches rbm
      WHERE rbm.request_id = sr.id
        AND rbm.status = 'aceite'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.admin_alerts aa
      WHERE aa.entity_type = 'service_request'
        AND aa.entity_id = sr.id
        AND aa.type = 'unanswered_24h'
        AND aa.resolved_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_award_automatic_badges(bid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge record;
  v_awarded integer := 0;
  v_stats record;
  v_business record;
  v_avg_resp_hours numeric;
  v_total_matches integer;
  v_accepted_matches integer;
  v_clicks_month integer;
  v_total_requests integer;
  v_views_total integer;
BEGIN
  SELECT claim_status, created_at, subscription_start_date, description, logo_url, schedule_weekdays, city
    INTO v_business
    FROM public.businesses
    WHERE id = bid;

  SELECT COALESCE(total_reviews, 0), COALESCE(average_rating, 0)
    INTO v_stats
    FROM public.business_review_stats
    WHERE business_id = bid;
  IF NOT FOUND THEN
    v_stats := ROW(0, 0.0);
  END IF;

  SELECT COALESCE(favorites_count, 0), COALESCE(views_total, 0)
    INTO v_stats.favorites_count, v_views_total
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
          v_qualifies := v_stats.total_reviews >= COALESCE((v_badge.criteria->>'min_reviews')::integer, 10)
                     AND v_stats.average_rating >= COALESCE((v_badge.criteria->>'min_rating')::numeric, 4.5);
        WHEN 'super-avaliado' THEN
          v_qualifies := v_stats.total_reviews >= COALESCE((v_badge.criteria->>'min_reviews')::integer, 25)
                     AND v_stats.average_rating >= COALESCE((v_badge.criteria->>'min_rating')::numeric, 4.8);
        WHEN 'local-favorite' THEN
          v_qualifies := COALESCE(v_stats.favorites_count, 0) >= COALESCE((v_badge.criteria->>'min_favorites')::integer, 50);
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

CREATE OR REPLACE FUNCTION public.compute_badge_progress(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _badge record;
  _val integer;
  _target integer;
  _business record;
  _avg_resp_hours numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.business_users
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  SELECT claim_status, created_at, subscription_start_date, description, logo_url, schedule_weekdays, city
    INTO _business
    FROM public.businesses
    WHERE id = p_business_id;

  FOR _badge IN
    SELECT id, slug, criteria FROM public.business_badges WHERE is_active = true
  LOOP
    _val := 0;
    _target := 1;

    IF (_badge.criteria->>'manual_approval')::boolean IS TRUE THEN
      _target := 1;
      IF _badge.slug = 'verified' THEN
        _val := CASE WHEN _business.claim_status = 'verified' THEN 1 ELSE 0 END;
      ELSE
        _val := 0;
      END IF;
    ELSIF _badge.criteria->>'joined_before' IS NOT NULL THEN
      _target := 1;
      _val := CASE
        WHEN COALESCE(_business.subscription_start_date, _business.created_at::date) < (_badge.criteria->>'joined_before')::date THEN 1
        ELSE 0
      END;
    ELSIF _badge.criteria->>'type' = 'profile_complete' THEN
      _target := 1;
      _val := CASE
        WHEN _business.description IS NOT NULL
         AND length(trim(_business.description)) > 50
         AND _business.logo_url IS NOT NULL
         AND _business.schedule_weekdays IS NOT NULL
         AND _business.city IS NOT NULL THEN 1
        ELSE 0
      END;
    ELSIF _badge.criteria->>'min_rating' IS NOT NULL THEN
      DECLARE
        _avg_rating numeric;
        _total_reviews integer;
        _min_rating numeric;
        _min_reviews integer;
      BEGIN
        _min_rating := (_badge.criteria->>'min_rating')::numeric;
        _min_reviews := COALESCE((_badge.criteria->>'min_reviews')::integer, 1);
        SELECT COALESCE(average_rating, 0), COALESCE(total_reviews, 0)
          INTO _avg_rating, _total_reviews
          FROM public.business_review_stats
          WHERE business_id = p_business_id;
        _target := _min_reviews;
        _val := CASE
          WHEN _avg_rating >= _min_rating AND _total_reviews >= _min_reviews THEN _min_reviews
          ELSE LEAST(_total_reviews, _min_reviews - 1)
        END;
      END;
    ELSIF _badge.criteria->>'min_favorites' IS NOT NULL THEN
      _target := (_badge.criteria->>'min_favorites')::integer;
      SELECT COALESCE(favorites_count, 0)
        INTO _val
        FROM public.business_analytics_metrics
        WHERE business_id = p_business_id;
    ELSIF _badge.criteria->>'avg_response_time_hours' IS NOT NULL THEN
      _target := 1;
      SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - sent_at)) / 3600.0)
        INTO _avg_resp_hours
        FROM public.request_business_matches
        WHERE business_id = p_business_id
          AND first_response_at IS NOT NULL;
      _val := CASE
        WHEN _avg_resp_hours IS NOT NULL AND _avg_resp_hours <= (_badge.criteria->>'avg_response_time_hours')::numeric THEN 1
        ELSE 0
      END;
    ELSIF _badge.criteria->>'type' = 'views' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 10);
      SELECT COALESCE(views_total, 0)
        INTO _val
        FROM public.business_analytics_metrics
        WHERE business_id = p_business_id;
    ELSIF _badge.criteria->>'type' = 'contacts' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 10);
      SELECT COUNT(*)
        INTO _val
        FROM public.analytics_events
        WHERE business_id = p_business_id
          AND event_type LIKE 'click_%'
          AND created_at >= date_trunc('month', now());
    ELSIF _badge.criteria->>'type' = 'requests' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 1);
      SELECT COUNT(*)
        INTO _val
        FROM public.request_business_matches
        WHERE business_id = p_business_id;
    ELSIF _badge.criteria->>'type' = 'acceptance_rate' THEN
      DECLARE
        _total_m integer;
        _accepted integer;
        _rate numeric;
        _min_rate integer;
        _min_matches integer;
      BEGIN
        _min_rate := COALESCE((_badge.criteria->>'min_rate')::integer, 80);
        _min_matches := COALESCE((_badge.criteria->>'min_matches')::integer, 10);
        SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'aceite')
          INTO _total_m, _accepted
          FROM public.request_business_matches
          WHERE business_id = p_business_id;
        _target := _min_matches;
        IF _total_m >= _min_matches THEN
          _rate := (_accepted::numeric / NULLIF(_total_m, 0) * 100);
          _val := CASE WHEN _rate >= _min_rate THEN _min_matches ELSE LEAST(_total_m, _min_matches - 1) END;
        ELSE
          _val := _total_m;
        END IF;
      END;
    END IF;

    INSERT INTO public.business_badge_progress (business_id, badge_id, current_value, target_value, updated_at)
    VALUES (p_business_id, _badge.id, _val, _target, now())
    ON CONFLICT (business_id, badge_id) DO UPDATE
      SET current_value = EXCLUDED.current_value,
          target_value = EXCLUDED.target_value,
          updated_at = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_badge_check_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'aceite' AND OLD.status IS DISTINCT FROM 'aceite' THEN
    PERFORM public.check_and_award_automatic_badges(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_consumer_match_accepted ON public.request_business_matches;