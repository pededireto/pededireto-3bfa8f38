CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  region TEXT,
  country TEXT DEFAULT 'PT',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_partner_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.partner_organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, organization_id)
);
-- Garantir tabela existe
CREATE TABLE IF NOT EXISTS public.business_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FIX 1: Enable RLS on all 19 unprotected tables
-- ============================================================

ALTER TABLE public.email_cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partner_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_review_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIX 1b: Add RLS policies for tables without any
-- ============================================================

-- business_analytics_events
CREATE POLICY "Anyone can insert analytics events" ON public.business_analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read analytics events" ON public.business_analytics_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Business owners can read own analytics" ON public.business_analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.business_users bu WHERE bu.business_id = business_analytics_events.business_id AND bu.user_id = auth.uid()));

-- business_badges
CREATE POLICY "Anyone can view badges" ON public.business_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.business_badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- business_earned_badges
CREATE POLICY "Anyone can view earned badges" ON public.business_earned_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage earned badges" ON public.business_earned_badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- business_partner_memberships
CREATE POLICY "Business owners can view own memberships" ON public.business_partner_memberships FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.business_users bu WHERE bu.business_id = business_partner_memberships.business_id AND bu.user_id = auth.uid()));
CREATE POLICY "Admins can manage partner memberships" ON public.business_partner_memberships FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- business_review_stats
CREATE POLICY "Anyone can view review stats" ON public.business_review_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage review stats" ON public.business_review_stats FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- business_scores
CREATE POLICY "Admins can manage business scores" ON public.business_scores FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Business owners can view own score" ON public.business_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.business_users bu WHERE bu.business_id = business_scores.business_id AND bu.user_id = auth.uid()));

-- cities
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- cs_actions
CREATE POLICY "Team can manage cs actions" ON public.cs_actions FOR ALL
  USING (public.is_admin() OR public.has_role(auth.uid(), 'cs'::app_role))
  WITH CHECK (public.is_admin() OR public.has_role(auth.uid(), 'cs'::app_role));

-- partner_organizations
CREATE POLICY "Anyone can view partner organizations" ON public.partner_organizations FOR SELECT USING (true);
CREATE POLICY "Admins can manage partner organizations" ON public.partner_organizations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- partner_promo_codes
CREATE POLICY "Anyone can view promo codes" ON public.partner_promo_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage promo codes" ON public.partner_promo_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- promo_code_usage
CREATE POLICY "Authenticated users can use promo codes" ON public.promo_code_usage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view promo code usage" ON public.promo_code_usage FOR SELECT USING (public.is_admin());

-- review_helpfulness_votes
CREATE POLICY "Users can vote on reviews" ON public.review_helpfulness_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own votes" ON public.review_helpfulness_votes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all votes" ON public.review_helpfulness_votes FOR SELECT USING (public.is_admin());

-- ============================================================
-- FIX 2: Recreate views exposing auth.users
-- ============================================================

DROP VIEW IF EXISTS public.onboarding_users_summary;
CREATE VIEW public.onboarding_users_summary
WITH (security_invoker = true)
AS
SELECT 
  p.user_id AS id,
  p.email,
  p.full_name,
  p.status,
  false AS email_confirmed,
  p.created_at,
  p.last_activity_at AS last_sign_in_at,
  ur.role AS user_role,
  CASE
    WHEN ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role, 'commercial'::app_role, 'onboarding'::app_role, 'cs'::app_role]) THEN 'Team'::text
    WHEN EXISTS (SELECT 1 FROM businesses WHERE businesses.owner_id = p.user_id OR businesses.owner_email = p.email) THEN 'Business Owner'::text
    WHEN EXISTS (SELECT 1 FROM business_users WHERE business_users.user_id = p.user_id) THEN 'Business Member'::text
    ELSE 'Consumer'::text
  END AS user_type,
  (SELECT count(*) FROM businesses WHERE businesses.owner_id = p.user_id) AS businesses_owned,
  (SELECT count(*) FROM business_users WHERE business_users.user_id = p.user_id) AS businesses_member
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id;

DROP VIEW IF EXISTS public.ticket_history_detailed;
CREATE VIEW public.ticket_history_detailed
WITH (security_invoker = true)
AS
SELECT 
  al.id,
  al.ticket_id,
  t.title AS ticket_title,
  al.change_type,
  al.old_value,
  al.new_value,
  al.notes,
  al.created_at,
  p.email AS changed_by_email,
  COALESCE(p.full_name, p.email) AS changed_by_name
FROM ticket_audit_log al
JOIN support_tickets t ON t.id = al.ticket_id
LEFT JOIN profiles p ON p.user_id = al.changed_by
ORDER BY al.created_at DESC;

-- ============================================================
-- FIX 3: Convert critical views to security_invoker
-- ============================================================

DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
WITH (security_invoker = true)
AS
WITH plan_level AS (
  SELECT b.id,
    CASE
      WHEN b.is_premium = true AND b.subscription_status = 'active'::subscription_status_tipo THEN 'pro'::text
      WHEN b.is_premium = false AND b.subscription_status = 'active'::subscription_status_tipo AND b.subscription_plan <> 'free'::subscription_plan_tipo THEN 'start'::text
      ELSE 'free'::text
    END AS level
  FROM businesses b
)
SELECT b.id, b.name, b.slug, b.description, b.logo_url, b.city, b.zone,
  b.alcance, b.public_address, b.category_id, b.subcategory_id,
  b.is_featured, b.is_premium, b.premium_level, b.display_order,
  pl.level AS plan_level,
  CASE WHEN pl.level = 'pro' THEN 'PRO' WHEN pl.level = 'start' THEN 'START' ELSE NULL END AS badge,
  b.cta_phone, b.cta_email, b.cta_website,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekdays ELSE NULL END AS schedule_weekdays,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekend ELSE NULL END AS schedule_weekend,
  CASE
    WHEN b.show_gallery = false OR b.images IS NULL THEN NULL::text[]
    WHEN pl.level = 'pro' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 6) t)
    WHEN pl.level = 'start' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 2) t)
    ELSE NULL::text[]
  END AS images,
  CASE WHEN pl.level = 'pro' AND b.show_whatsapp = true THEN b.cta_whatsapp ELSE NULL END AS cta_whatsapp,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.instagram_url ELSE NULL END AS instagram_url,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.facebook_url ELSE NULL END AS facebook_url,
  CASE WHEN pl.level = 'pro' AND b.show_social = true THEN b.other_social_url ELSE NULL END AS other_social_url
FROM businesses b
JOIN plan_level pl ON pl.id = b.id
WHERE b.is_active = true;

DROP VIEW IF EXISTS public.top_rated_businesses;
CREATE VIEW public.top_rated_businesses
WITH (security_invoker = true)
AS
SELECT b.id, b.name, b.slug, b.city, b.category_id,
  brs.average_rating, brs.total_reviews, brs.verified_reviews_count
FROM businesses b
JOIN business_review_stats brs ON brs.business_id = b.id
WHERE b.is_active = true AND brs.total_reviews >= 5
ORDER BY brs.average_rating DESC, brs.total_reviews DESC;

DROP VIEW IF EXISTS public.business_dashboard_summary;
CREATE VIEW public.business_dashboard_summary
WITH (security_invoker = true)
AS
SELECT b.id, b.name, b.slug, b.is_active,
  COALESCE(brs.total_reviews, 0) AS total_reviews,
  COALESCE(brs.average_rating, 0) AS average_rating,
  COALESCE(brs.verified_reviews_count, 0) AS verified_reviews,
  COALESCE(bam.views_this_month, 0) AS views_this_month,
  COALESCE(bam.leads_this_month, 0) AS leads_this_month,
  COALESCE(bam.conversion_rate_this_month, 0) AS conversion_rate,
  (SELECT count(*) FROM business_earned_badges WHERE business_earned_badges.business_id = b.id) AS badges_count,
  (SELECT count(*) FROM business_notifications WHERE business_notifications.business_id = b.id AND business_notifications.is_read = false) AS unread_notifications
FROM businesses b
LEFT JOIN business_review_stats brs ON brs.business_id = b.id
LEFT JOIN business_analytics_metrics bam ON bam.business_id = b.id;

DROP VIEW IF EXISTS public.admin_unread_alerts;
CREATE VIEW public.admin_unread_alerts
WITH (security_invoker = true)
AS
SELECT count(*) AS unread_count FROM admin_alerts WHERE is_read = false;

-- Grant permissions
GRANT SELECT ON public.onboarding_users_summary TO authenticated;
GRANT SELECT ON public.ticket_history_detailed TO authenticated;
GRANT SELECT ON public.businesses_public TO anon, authenticated;
GRANT SELECT ON public.top_rated_businesses TO anon, authenticated;
GRANT SELECT ON public.business_dashboard_summary TO authenticated;
GRANT SELECT ON public.admin_unread_alerts TO authenticated;



