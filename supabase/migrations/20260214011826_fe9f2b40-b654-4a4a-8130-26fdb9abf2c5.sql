-- Criar tabelas em falta
CREATE TABLE IF NOT EXISTS public.business_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intent_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.search_logs_intelligent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  user_id UUID REFERENCES auth.users(id),
  results_count INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_search_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- FIX 1: Enable RLS on 5 tables missing it
-- =============================================

-- business_analytics_events
ALTER TABLE public.business_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all business analytics events"
ON public.business_analytics_events FOR ALL
USING (public.is_admin());

CREATE POLICY "Anyone can insert business analytics events"
ON public.business_analytics_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can view their own analytics"
ON public.business_analytics_events FOR SELECT
USING (
  business_id IN (
    SELECT bu.business_id FROM business_users bu WHERE bu.user_id = auth.uid()
  )
);

-- intent_categories (reference/lookup data - read-only for all authenticated)
ALTER TABLE public.intent_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read intent categories"
ON public.intent_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage intent categories"
ON public.intent_categories FOR ALL
USING (public.is_admin());

-- search_intelligence_logs
ALTER TABLE public.search_intelligence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search intelligence logs"
ON public.search_intelligence_logs FOR ALL
USING (public.is_admin());

CREATE POLICY "Anyone can insert search intelligence logs"
ON public.search_intelligence_logs FOR INSERT
WITH CHECK (true);

-- search_logs_intelligent
ALTER TABLE public.search_logs_intelligent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search logs intelligent"
ON public.search_logs_intelligent FOR ALL
USING (public.is_admin());

CREATE POLICY "Anyone can insert search logs intelligent"
ON public.search_logs_intelligent FOR INSERT
WITH CHECK (true);

-- user_search_context
ALTER TABLE public.user_search_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user search context"
ON public.user_search_context FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can manage their own search context"
ON public.user_search_context FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FIX 2: Recreate views with security_invoker = true
-- =============================================

CREATE OR REPLACE VIEW public.analytics_overview
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM profiles) AS total_users,
  (SELECT count(*) FROM businesses) AS total_businesses,
  (SELECT count(*) FROM businesses WHERE is_active = true) AS active_businesses,
  (SELECT count(*) FROM service_requests) AS total_requests,
  (SELECT count(*) FROM search_logs) AS total_searches,
  (SELECT count(*) FROM analytics_events) AS total_events;

CREATE OR REPLACE VIEW public.commercial_alerts_view
WITH (security_invoker = true) AS
SELECT id, name, nif, owner_name, owner_phone, owner_email, created_at
FROM businesses
WHERE is_active = false
  AND commercial_status = 'nao_contactado'
  AND registration_source = 'self_service';

CREATE OR REPLACE VIEW public.commercial_performance
WITH (security_invoker = true) AS
SELECT converted_by, count(*) AS total_converted, sum(conversion_price) AS revenue_generated
FROM businesses
WHERE converted_by IS NOT NULL
GROUP BY converted_by
ORDER BY sum(conversion_price) DESC;

CREATE OR REPLACE VIEW public.dashboard_executive
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM profiles) AS total_users,
  (SELECT count(*) FROM profiles WHERE created_at >= date_trunc('month', now())) AS new_users_this_month,
  (SELECT count(*) FROM businesses) AS total_businesses,
  (SELECT count(*) FROM businesses WHERE is_active = true) AS active_businesses,
  (SELECT count(*) FROM service_requests) AS total_requests,
  (SELECT count(*) FROM service_requests WHERE created_at >= date_trunc('month', now())) AS new_requests_this_month,
  (SELECT count(*) FROM search_logs) AS total_searches,
  (SELECT COALESCE(sum(conversion_price), 0) FROM businesses WHERE conversion_date >= date_trunc('month', now())) AS revenue_this_month;

CREATE OR REPLACE VIEW public.dashboard_growth
WITH (security_invoker = true) AS
SELECT date_trunc('week', created_at) AS week,
  count(*) FILTER (WHERE table_name = 'profiles') AS new_users,
  count(*) FILTER (WHERE table_name = 'businesses') AS new_businesses
FROM (
  SELECT created_at, 'profiles'::text AS table_name FROM profiles
  UNION ALL
  SELECT created_at, 'businesses'::text AS table_name FROM businesses
) t
GROUP BY date_trunc('week', created_at)
ORDER BY date_trunc('week', created_at) DESC;

CREATE OR REPLACE VIEW public.dashboard_marketplace
WITH (security_invoker = true) AS
SELECT count(DISTINCT sr.id) AS total_requests,
  count(DISTINCT b.id) AS total_businesses,
  round(count(DISTINCT sr.id)::numeric / NULLIF(count(DISTINCT b.id), 0)::numeric, 2) AS request_business_ratio
FROM service_requests sr CROSS JOIN businesses b;

CREATE OR REPLACE VIEW public.dashboard_revenue
WITH (security_invoker = true) AS
SELECT date_trunc('month', conversion_date) AS month,
  count(*) AS total_conversions,
  sum(conversion_price) AS total_revenue,
  avg(conversion_price) AS average_ticket
FROM businesses
WHERE conversion_date IS NOT NULL
GROUP BY date_trunc('month', conversion_date)
ORDER BY date_trunc('month', conversion_date) DESC;

CREATE OR REPLACE VIEW public.revenue_monthly
WITH (security_invoker = true) AS
SELECT date_trunc('month', conversion_date) AS month,
  count(*) AS total_conversions,
  sum(conversion_price) AS total_revenue
FROM businesses
WHERE conversion_date IS NOT NULL
GROUP BY date_trunc('month', conversion_date)
ORDER BY date_trunc('month', conversion_date) DESC;

CREATE OR REPLACE VIEW public.search_insights
WITH (security_invoker = true) AS
SELECT search_term, count(*) AS total_searches,
  sum(CASE WHEN results_count = 0 THEN 1 ELSE 0 END) AS searches_without_results
FROM search_logs
GROUP BY search_term
ORDER BY count(*) DESC;

CREATE OR REPLACE VIEW public.view_business_performance
WITH (security_invoker = true) AS
SELECT business_id,
  count(*) FILTER (WHERE event_type = 'impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'profile_view') AS profile_views,
  count(*) FILTER (WHERE event_type LIKE 'click_%') AS total_clicks,
  round(count(*) FILTER (WHERE event_type LIKE 'click_%')::numeric / NULLIF(count(*) FILTER (WHERE event_type = 'impression'), 0)::numeric, 4) AS ctr
FROM business_analytics_events
GROUP BY business_id;

CREATE OR REPLACE VIEW public.view_no_result_opportunities
WITH (security_invoker = true) AS
SELECT input_text, count(*) AS frequency, max(created_at) AS last_searched
FROM search_intelligence_logs
WHERE results_count = 0
GROUP BY input_text
HAVING count(*) >= 2
ORDER BY count(*) DESC;

CREATE OR REPLACE VIEW public.view_search_overview
WITH (security_invoker = true) AS
SELECT count(*) AS total_searches,
  count(*) FILTER (WHERE results_count = 0) AS no_result_searches,
  round((count(*) FILTER (WHERE results_count = 0))::numeric * 100.0 / NULLIF(count(*), 0)::numeric, 2) AS percent_no_results,
  count(*) FILTER (WHERE intent_type = 'emergency') AS emergency_searches,
  count(*) FILTER (WHERE intent_type = 'quote') AS quote_searches,
  count(*) FILTER (WHERE intent_type = 'information') AS info_searches,
  count(*) FILTER (WHERE intent_type = 'purchase') AS purchase_searches
FROM search_intelligence_logs;

CREATE OR REPLACE VIEW public.view_searches_by_city
WITH (security_invoker = true) AS
SELECT user_city, count(*) AS total_searches
FROM search_intelligence_logs
WHERE user_city IS NOT NULL
GROUP BY user_city
ORDER BY count(*) DESC;

CREATE OR REPLACE VIEW public.view_searches_per_day
WITH (security_invoker = true) AS
SELECT date(created_at) AS search_day, count(*) AS total_searches
FROM search_intelligence_logs
GROUP BY date(created_at)
ORDER BY date(created_at);

CREATE OR REPLACE VIEW public.view_top_search_terms
WITH (security_invoker = true) AS
SELECT input_text, count(*) AS frequency
FROM search_intelligence_logs
GROUP BY input_text
ORDER BY count(*) DESC;

