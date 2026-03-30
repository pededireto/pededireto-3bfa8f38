-- ═══════════════════════════════════════════════════════
-- 1. Insert 3 new badges
-- ═══════════════════════════════════════════════════════
INSERT INTO public.business_badges (name, slug, description, color, criteria, is_automatic, is_public, display_order, is_active)
VALUES
  ('Muito Solicitado', 'muito-solicitado', 'Mais de 50 pedidos de orçamento recebidos', '#f97316', '{"type":"requests","target":50}', true, true, 11, true),
  ('Top Resposta', 'top-resposta', 'Aceita mais de 80% dos pedidos recebidos', '#3b82f6', '{"type":"acceptance_rate","min_rate":80,"min_matches":10}', true, true, 12, true),
  ('Super Avaliado', 'super-avaliado', 'Avaliação excepcional — 4.8+ estrelas com 25+ reviews', '#f59e0b', '{"min_rating":4.8,"min_reviews":25}', true, true, 13, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 2. Fix compute_badge_progress — full rewrite
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.compute_badge_progress(p_business_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _badge    RECORD;
  _val      integer;
  _target   integer;
  _business RECORD;
  _avg_resp_hours numeric;
BEGIN
  -- Permission check
  IF NOT EXISTS (
    SELECT 1 FROM business_users WHERE business_id = p_business_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this business';
  END IF;

  SELECT claim_status, created_at, subscription_start_date,
         description, logo_url, schedule_weekdays, city
  INTO _business FROM businesses WHERE id = p_business_id;

  FOR _badge IN SELECT id, slug, criteria FROM business_badges WHERE is_active = true
  LOOP
    _val    := 0;
    _target := 1;

    -- Manual badges
    IF (_badge.criteria->>'manual_approval')::boolean IS TRUE THEN
      _target := 1;
      IF _badge.slug = 'verified' THEN
        _val := CASE WHEN _business.claim_status = 'verified' THEN 1 ELSE 0 END;
      ELSE
        _val := 0; -- manual badges stay 0 until granted
      END IF;

    -- Membro Fundador
    ELSIF _badge.criteria->>'joined_before' IS NOT NULL THEN
      _target := 1;
      _val := CASE
        WHEN COALESCE(_business.subscription_start_date, _business.created_at::date)
             < (_badge.criteria->>'joined_before')::date
        THEN 1 ELSE 0 END;

    -- Perfil Completo
    ELSIF _badge.criteria->>'type' = 'profile_complete' THEN
      _target := 1;
      _val := CASE
        WHEN _business.description IS NOT NULL AND length(trim(_business.description)) > 50
         AND _business.logo_url IS NOT NULL
         AND _business.schedule_weekdays IS NOT NULL
         AND _business.city IS NOT NULL
        THEN 1 ELSE 0 END;

    -- Top Avaliado / Super Avaliado (min_rating + min_reviews)
    ELSIF _badge.criteria->>'min_rating' IS NOT NULL THEN
      DECLARE
        _avg_rating numeric; _total_reviews integer;
        _min_rating numeric; _min_reviews integer;
      BEGIN
        _min_rating  := (_badge.criteria->>'min_rating')::numeric;
        _min_reviews := COALESCE((_badge.criteria->>'min_reviews')::integer, 1);
        SELECT COALESCE(average_rating, 0), COALESCE(total_reviews, 0)
          INTO _avg_rating, _total_reviews
          FROM business_review_stats WHERE business_id = p_business_id;
        _target := _min_reviews;
        _val := CASE WHEN _avg_rating >= _min_rating AND _total_reviews >= _min_reviews
                     THEN _min_reviews ELSE LEAST(_total_reviews, _min_reviews - 1) END;
      END;

    -- Favorito Local
    ELSIF _badge.criteria->>'min_favorites' IS NOT NULL THEN
      _target := (_badge.criteria->>'min_favorites')::integer;
      SELECT COALESCE(favorites_count, 0) INTO _val
        FROM business_analytics_metrics WHERE business_id = p_business_id;

    -- Resposta Rápida — FIXED: real calculation
    ELSIF _badge.criteria->>'avg_response_time_hours' IS NOT NULL THEN
      _target := 1;
      SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - sent_at)) / 3600.0)
        INTO _avg_resp_hours
        FROM request_business_matches
        WHERE business_id = p_business_id AND first_response_at IS NOT NULL;
      IF _avg_resp_hours IS NOT NULL AND _avg_resp_hours <= (_badge.criteria->>'avg_response_time_hours')::numeric THEN
        _val := 1;
      ELSE
        _val := 0;
      END IF;

    -- Views
    ELSIF _badge.criteria->>'type' = 'views' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 10);
      SELECT COALESCE(views_total, 0) INTO _val
        FROM business_analytics_metrics WHERE business_id = p_business_id;

    -- Contacts (Em Chamas) — FIXED: filter current month
    ELSIF _badge.criteria->>'type' = 'contacts' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 10);
      SELECT COUNT(*) INTO _val FROM analytics_events
        WHERE business_id = p_business_id
          AND event_type LIKE 'click_%'
          AND created_at >= date_trunc('month', now());

    -- Requests (Primeira Faísca / Muito Solicitado)
    ELSIF _badge.criteria->>'type' = 'requests' THEN
      _target := COALESCE((_badge.criteria->>'target')::integer, 1);
      SELECT COUNT(*) INTO _val FROM request_business_matches
        WHERE business_id = p_business_id;

    -- Acceptance Rate (Top Resposta)
    ELSIF _badge.criteria->>'type' = 'acceptance_rate' THEN
      DECLARE
        _total_m integer; _accepted integer; _rate numeric;
        _min_rate integer; _min_matches integer;
      BEGIN
        _min_rate    := COALESCE((_badge.criteria->>'min_rate')::integer, 80);
        _min_matches := COALESCE((_badge.criteria->>'min_matches')::integer, 10);
        SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'accepted')
          INTO _total_m, _accepted
          FROM request_business_matches WHERE business_id = p_business_id;
        _target := _min_matches;
        IF _total_m >= _min_matches THEN
          _rate := (_accepted::numeric / _total_m * 100);
          _val := CASE WHEN _rate >= _min_rate THEN _min_matches ELSE LEAST(_total_m, _min_matches - 1) END;
        ELSE
          _val := _total_m;
        END IF;
      END;

    END IF;

    INSERT INTO business_badge_progress (business_id, badge_id, current_value, target_value, updated_at)
    VALUES (p_business_id, _badge.id, _val, _target, now())
    ON CONFLICT (business_id, badge_id) DO UPDATE
      SET current_value = EXCLUDED.current_value, target_value = EXCLUDED.target_value, updated_at = now();
  END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- 3. Full rewrite of check_and_award_automatic_badges
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.check_and_award_automatic_badges(bid uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_badge RECORD;
  v_awarded INTEGER := 0;
  v_stats RECORD;
  v_business RECORD;
  v_avg_resp_hours numeric;
  v_total_matches integer;
  v_accepted_matches integer;
  v_clicks_month integer;
  v_total_requests integer;
  v_views_total integer;
BEGIN
  -- Business info
  SELECT claim_status, created_at, subscription_start_date,
         description, logo_url, schedule_weekdays, city
  INTO v_business FROM businesses WHERE id = bid;

  -- Review stats
  SELECT COALESCE(total_reviews, 0), COALESCE(average_rating, 0)
  INTO v_stats FROM business_review_stats WHERE business_id = bid;
  IF NOT FOUND THEN v_stats := ROW(0, 0.0); END IF;

  -- Analytics
  SELECT COALESCE(favorites_count, 0), COALESCE(views_total, 0)
  INTO v_stats.favorites_count, v_views_total
  FROM business_analytics_metrics WHERE business_id = bid;

  -- Matches
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'accepted')
  INTO v_total_matches, v_accepted_matches
  FROM request_business_matches WHERE business_id = bid;

  -- Total requests
  v_total_requests := v_total_matches;

  -- Avg response time
  SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - sent_at)) / 3600.0)
  INTO v_avg_resp_hours
  FROM request_business_matches
  WHERE business_id = bid AND first_response_at IS NOT NULL;

  -- Clicks this month
  SELECT COUNT(*) INTO v_clicks_month FROM analytics_events
  WHERE business_id = bid AND event_type LIKE 'click_%'
    AND created_at >= date_trunc('month', now());

  FOR v_badge IN SELECT * FROM business_badges WHERE is_automatic = true AND is_active = true
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
                     AND (v_accepted_matches::numeric / v_total_matches * 100) >= COALESCE((v_badge.criteria->>'min_rate')::integer, 80);

        ELSE
          v_qualifies := false;
      END CASE;

      IF v_qualifies THEN
        INSERT INTO business_earned_badges (business_id, badge_id, earned_automatically)
        VALUES (bid, v_badge.id, true)
        ON CONFLICT (business_id, badge_id) DO NOTHING;
        IF FOUND THEN v_awarded := v_awarded + 1; END IF;
      END IF;
    END;
  END LOOP;

  RETURN v_awarded;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- 4. Notification trigger on badge earned
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.trg_notify_badge_earned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_badge_name text;
  v_badge_desc text;
  v_owner_id uuid;
BEGIN
  SELECT name, description INTO v_badge_name, v_badge_desc
    FROM business_badges WHERE id = NEW.badge_id;

  SELECT user_id INTO v_owner_id
    FROM business_users WHERE business_id = NEW.business_id AND role = 'owner' LIMIT 1;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO business_notifications (business_id, user_id, type, title, message, action_url)
    VALUES (
      NEW.business_id,
      v_owner_id,
      'badge_earned',
      '🏅 Conquistou o badge ' || COALESCE(v_badge_name, '') || '!',
      COALESCE(v_badge_desc, 'Parabéns pela conquista!') || ' Ver os seus badges →',
      '/negocio/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_badge_earned ON public.business_earned_badges;
CREATE TRIGGER trg_notify_badge_earned
  AFTER INSERT ON public.business_earned_badges
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_badge_earned();

-- ═══════════════════════════════════════════════════════
-- 5. Realtime triggers for badge checks
-- ═══════════════════════════════════════════════════════

-- After review approved
CREATE OR REPLACE FUNCTION public.trg_badge_check_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND (OLD.moderation_status IS DISTINCT FROM 'approved') THEN
    PERFORM check_and_award_automatic_badges(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_badge_check_on_review ON public.business_reviews;
CREATE TRIGGER trg_badge_check_on_review
  AFTER UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_badge_check_on_review();

-- After match accepted
CREATE OR REPLACE FUNCTION public.trg_badge_check_on_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    PERFORM check_and_award_automatic_badges(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_badge_check_on_match ON public.request_business_matches;
CREATE TRIGGER trg_badge_check_on_match
  AFTER UPDATE ON public.request_business_matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_badge_check_on_match();

-- After analytics event (sampled 1%)
CREATE OR REPLACE FUNCTION public.trg_badge_check_on_analytics()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF random() < 0.01 AND NEW.business_id IS NOT NULL THEN
    PERFORM check_and_award_automatic_badges(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_badge_check_on_analytics ON public.analytics_events;
CREATE TRIGGER trg_badge_check_on_analytics
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_badge_check_on_analytics();