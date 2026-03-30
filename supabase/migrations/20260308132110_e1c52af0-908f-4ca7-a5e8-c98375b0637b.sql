
-- ============================================================
-- 1. UPDATED calculate_business_score WITH ENGAGEMENT COMPONENT
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_business_score(p_business_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_biz record;
  v_reviews record;
  v_requests integer;
  v_response_rate numeric;
  v_engagement_raw numeric := 0;
  v_engagement_score integer := 0;
  v_views integer;
  v_click_phone integer;
  v_click_whatsapp integer;
  v_click_email integer;
  v_click_website integer;
BEGIN
  SELECT * INTO v_biz FROM businesses WHERE id = p_business_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- ── Profile completeness (max 25) ──
  IF v_biz.name IS NOT NULL              THEN v_score := v_score + 3; END IF;
  IF v_biz.description IS NOT NULL       THEN v_score := v_score + 5; END IF;
  IF v_biz.logo_url IS NOT NULL          THEN v_score := v_score + 5; END IF;
  IF v_biz.cta_whatsapp IS NOT NULL
     OR v_biz.cta_phone IS NOT NULL      THEN v_score := v_score + 4; END IF;
  IF v_biz.cta_email IS NOT NULL         THEN v_score := v_score + 2; END IF;
  IF v_biz.schedule_weekdays IS NOT NULL THEN v_score := v_score + 3; END IF;
  IF v_biz.public_address IS NOT NULL    THEN v_score := v_score + 3; END IF;

  -- ── Reviews (max 30) ──
  SELECT COUNT(*) as total, COALESCE(AVG(rating), 0) as avg_rating
  INTO v_reviews
  FROM business_reviews
  WHERE business_id = p_business_id AND moderation_status = 'approved';

  IF v_reviews.total >= 50    THEN v_score := v_score + 15;
  ELSIF v_reviews.total >= 20 THEN v_score := v_score + 10;
  ELSIF v_reviews.total >= 10 THEN v_score := v_score + 7;
  ELSIF v_reviews.total >= 5  THEN v_score := v_score + 4;
  ELSIF v_reviews.total >= 1  THEN v_score := v_score + 2;
  END IF;

  IF v_reviews.avg_rating >= 4.5    THEN v_score := v_score + 15;
  ELSIF v_reviews.avg_rating >= 4.0 THEN v_score := v_score + 10;
  ELSIF v_reviews.avg_rating >= 3.5 THEN v_score := v_score + 5;
  END IF;

  -- ── Response rate (max 20) ──
  SELECT COUNT(*) INTO v_requests
  FROM request_business_matches WHERE business_id = p_business_id;

  IF v_requests > 0 THEN
    SELECT ROUND(
      COUNT(CASE WHEN status IN ('em_conversa', 'orcamento_enviado', 'aceite') THEN 1 END)::numeric / COUNT(*) * 100
    ) INTO v_response_rate
    FROM request_business_matches WHERE business_id = p_business_id;

    IF v_response_rate >= 80    THEN v_score := v_score + 20;
    ELSIF v_response_rate >= 60 THEN v_score := v_score + 12;
    ELSIF v_response_rate >= 40 THEN v_score := v_score + 6;
    ELSIF v_response_rate >= 20 THEN v_score := v_score + 3;
    END IF;
  END IF;

  -- ── NEW: Engagement score (max 25, rolling 30 days) ──
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'view'),
    COUNT(*) FILTER (WHERE event_type = 'click_phone'),
    COUNT(*) FILTER (WHERE event_type = 'click_whatsapp'),
    COUNT(*) FILTER (WHERE event_type = 'click_email'),
    COUNT(*) FILTER (WHERE event_type = 'click_website')
  INTO v_views, v_click_phone, v_click_whatsapp, v_click_email, v_click_website
  FROM analytics_events
  WHERE business_id = p_business_id
    AND created_at >= NOW() - INTERVAL '30 days';

  v_engagement_raw := (v_click_phone * 3)
                    + (v_click_whatsapp * 3)
                    + (v_click_email * 2)
                    + (v_click_website * 2)
                    + (v_views * 0.5);

  v_engagement_score := LEAST(ROUND(v_engagement_raw)::integer, 25);
  v_score := v_score + v_engagement_score;

  -- ── Premium multiplier ──
  IF v_biz.is_premium = true OR v_biz.is_featured = true THEN
    v_score := ROUND(v_score * 1.15);
  END IF;

  -- ── Inactivity penalty ──
  IF v_biz.updated_at < NOW() - INTERVAL '30 days' THEN
    v_score := ROUND(v_score * 0.7);
  ELSIF v_biz.updated_at < NOW() - INTERVAL '14 days' THEN
    v_score := ROUND(v_score * 0.9);
  END IF;

  -- ── Persist score ──
  INSERT INTO business_scores (business_id, score, updated_at)
  VALUES (p_business_id, v_score, NOW())
  ON CONFLICT (business_id) DO UPDATE
    SET score = EXCLUDED.score, updated_at = NOW();

  RETURN v_score;
END;
$$;

-- ============================================================
-- 2. REMOVE WASTEFUL TRIGGER (recalculates on every analytics INSERT)
-- ============================================================
DROP TRIGGER IF EXISTS trg_update_ranking_score ON analytics_events;

-- Keep the review trigger (recalculates only on review approval — low frequency, high value)

-- ============================================================
-- 3. EXPAND DAILY CRON TO RECALCULATE ALL RANKING SCORES
-- ============================================================
-- Create helper function for cron
CREATE OR REPLACE FUNCTION recalculate_all_ranking_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_biz record;
  v_new_score integer;
BEGIN
  FOR v_biz IN SELECT id FROM businesses WHERE is_active = true LOOP
    v_new_score := calculate_business_score(v_biz.id);
    UPDATE businesses SET ranking_score = v_new_score WHERE id = v_biz.id;
  END LOOP;
END;
$$;

-- Schedule daily ranking recalculation at 03:15 (after badges at 03:00)
SELECT cron.schedule(
  'recalculate-rankings-daily',
  '15 3 * * *',
  $$SELECT recalculate_all_ranking_scores();$$
);
