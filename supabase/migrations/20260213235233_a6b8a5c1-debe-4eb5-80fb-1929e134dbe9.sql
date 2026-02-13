
-- 1.1 Feature Flag
ALTER TABLE plan_rules 
ADD COLUMN IF NOT EXISTS allow_analytics_pro BOOLEAN NOT NULL DEFAULT false;

-- 1.2 Indices
CREATE INDEX IF NOT EXISTS idx_sil_created_at ON search_intelligence_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_ae_business_id ON analytics_events (business_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_sr_created_at ON service_requests (created_at);

-- 1.3 Admin Global Intelligence Function
CREATE OR REPLACE FUNCTION public.get_admin_intelligence(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  v_cutoff timestamptz := NOW() - (p_days || ' days')::interval;
BEGIN
  -- Only admins
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'executive', (
      SELECT json_build_object(
        'total_users', (SELECT count(*) FROM profiles),
        'total_businesses', (SELECT count(*) FROM businesses),
        'active_businesses', (SELECT count(*) FROM businesses WHERE is_active = true AND subscription_status = 'active'),
        'total_requests', (SELECT count(*) FROM service_requests WHERE created_at >= v_cutoff),
        'total_searches', (SELECT count(*) FROM search_intelligence_logs WHERE created_at >= v_cutoff),
        'revenue_this_month', COALESCE((
          SELECT sum(amount) FROM revenue_events 
          WHERE event_date >= date_trunc('month', NOW())
        ), 0),
        'mrr_estimate', COALESCE((
          SELECT sum(subscription_price) FROM businesses 
          WHERE subscription_status = 'active' AND subscription_price > 0
        ), 0)
      )
    ),
    'revenue', json_build_object(
      'monthly_revenue', COALESCE((
        SELECT json_agg(r ORDER BY r.month)
        FROM (
          SELECT to_char(event_date, 'YYYY-MM') as month, sum(amount) as total
          FROM revenue_events
          WHERE event_date >= v_cutoff
          GROUP BY to_char(event_date, 'YYYY-MM')
        ) r
      ), '[]'::json),
      'conversions_by_plan', COALESCE((
        SELECT json_agg(r)
        FROM (
          SELECT cp.name as plan_name, count(*) as total
          FROM businesses b
          JOIN commercial_plans cp ON cp.id = b.plan_id
          WHERE b.conversion_date >= v_cutoff
          GROUP BY cp.name
          ORDER BY total DESC
        ) r
      ), '[]'::json),
      'revenue_by_commercial', COALESCE((
        SELECT json_agg(r)
        FROM (
          SELECT p.full_name as commercial_name, sum(re.amount) as total
          FROM revenue_events re
          JOIN profiles p ON p.id = re.assigned_user_id
          WHERE re.event_date >= v_cutoff
          GROUP BY p.full_name
          ORDER BY total DESC
          LIMIT 10
        ) r
      ), '[]'::json)
    ),
    'search', json_build_object(
      'total_searches', (SELECT count(*) FROM search_intelligence_logs WHERE created_at >= v_cutoff),
      'no_result_percent', COALESCE((
        SELECT round(
          (count(*) FILTER (WHERE results_count = 0)::numeric / NULLIF(count(*), 0)) * 100, 1
        )
        FROM search_intelligence_logs WHERE created_at >= v_cutoff
      ), 0),
      'top_terms', COALESCE((
        SELECT json_agg(r)
        FROM (
          SELECT input_text as term, count(*) as total
          FROM search_intelligence_logs
          WHERE created_at >= v_cutoff AND input_text IS NOT NULL
          GROUP BY input_text
          ORDER BY total DESC
          LIMIT 20
        ) r
      ), '[]'::json),
      'searches_by_city', COALESCE((
        SELECT json_agg(r)
        FROM (
          SELECT user_city as city, count(*) as total
          FROM search_intelligence_logs
          WHERE created_at >= v_cutoff AND user_city IS NOT NULL
          GROUP BY user_city
          ORDER BY total DESC
          LIMIT 10
        ) r
      ), '[]'::json),
      'intent_breakdown', COALESCE((
        SELECT json_agg(r)
        FROM (
          SELECT COALESCE(intent_type, 'unknown') as intent, count(*) as total
          FROM search_intelligence_logs
          WHERE created_at >= v_cutoff
          GROUP BY intent_type
          ORDER BY total DESC
        ) r
      ), '[]'::json)
    ),
    'marketplace', json_build_object(
      'request_business_ratio', COALESCE((
        SELECT round(
          (SELECT count(*)::numeric FROM service_requests WHERE created_at >= v_cutoff) /
          NULLIF((SELECT count(*) FROM businesses WHERE is_active = true), 0), 2
        )
      ), 0),
      'inactive_businesses', (
        SELECT count(*) FROM businesses WHERE is_active = false OR subscription_status != 'active'
      ),
      'avg_response_time', COALESCE((
        SELECT round(avg(EXTRACT(EPOCH FROM (rbm.responded_at - rbm.sent_at)) / 3600)::numeric, 1)
        FROM request_business_matches rbm
        WHERE rbm.responded_at IS NOT NULL AND rbm.sent_at >= v_cutoff
      ), 0)
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 1.4 Business Scoped Intelligence Function
CREATE OR REPLACE FUNCTION public.get_business_intelligence(p_business_id uuid, p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  v_cutoff timestamptz := NOW() - (p_days || ' days')::interval;
  v_business RECORD;
  v_impressions bigint;
  v_clicks bigint;
BEGIN
  -- Get business and validate ownership
  SELECT b.*, pr.allow_analytics_pro
  INTO v_business
  FROM businesses b
  LEFT JOIN plan_rules pr ON pr.plan_id = b.plan_id
  WHERE b.id = p_business_id;

  IF v_business IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  -- Check if admin or business owner
  IF NOT public.is_admin() THEN
    -- Check owner by matching email in profiles
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND email = v_business.owner_email
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check feature flag
    IF NOT COALESCE(v_business.allow_analytics_pro, false) THEN
      RAISE EXCEPTION 'Feature not available for current plan';
    END IF;
  END IF;

  -- Count impressions and clicks
  SELECT count(*) FILTER (WHERE event_type = 'impression'),
         count(*) FILTER (WHERE event_type = 'click')
  INTO v_impressions, v_clicks
  FROM analytics_events
  WHERE business_id = p_business_id AND created_at >= v_cutoff;

  SELECT json_build_object(
    'impressions', v_impressions,
    'clicks', v_clicks,
    'ctr', CASE WHEN v_impressions > 0 
      THEN round((v_clicks::numeric / v_impressions) * 100, 1) 
      ELSE 0 END,
    'searches_in_category', COALESCE((
      SELECT count(*)
      FROM search_intelligence_logs sil
      JOIN pattern_categories pc ON pc.pattern_id = sil.detected_pattern_id
      WHERE sil.created_at >= v_cutoff
        AND (pc.category_id = v_business.category_id OR pc.subcategory_id = v_business.subcategory_id)
    ), 0),
    'searches_in_city', COALESCE((
      SELECT count(*)
      FROM search_intelligence_logs
      WHERE created_at >= v_cutoff AND lower(user_city) = lower(v_business.city)
    ), 0),
    'trend', COALESCE((
      SELECT json_agg(r ORDER BY r.day)
      FROM (
        SELECT created_at::date as day, 
               count(*) FILTER (WHERE event_type = 'impression') as impressions,
               count(*) FILTER (WHERE event_type = 'click') as clicks
        FROM analytics_events
        WHERE business_id = p_business_id AND created_at >= v_cutoff
        GROUP BY created_at::date
      ) r
    ), '[]'::json),
    'position_average', COALESCE((
      SELECT round(avg(position)::numeric, 1)
      FROM analytics_events
      WHERE business_id = p_business_id AND created_at >= v_cutoff AND position IS NOT NULL
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$;
