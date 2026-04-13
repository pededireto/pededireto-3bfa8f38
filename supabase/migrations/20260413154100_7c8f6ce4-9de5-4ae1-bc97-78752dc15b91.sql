CREATE OR REPLACE VIEW public.businesses_public
WITH (security_invoker=on) AS
WITH plan_level AS (
  SELECT b.id,
    CASE
      -- Active trial = PRO
      WHEN b.trial_ends_at IS NOT NULL AND b.trial_ends_at > now() THEN 'pro'
      -- Premium with active subscription = PRO
      WHEN b.is_premium = true AND b.subscription_status = 'active'::subscription_status_tipo THEN 'pro'
      -- Non-premium with active paid subscription = START
      WHEN b.is_premium = false AND b.subscription_status = 'active'::subscription_status_tipo AND b.subscription_plan <> 'free'::subscription_plan_tipo THEN 'start'
      ELSE 'free'
    END AS level
  FROM businesses b
)
SELECT
  b.id,
  b.name,
  b.slug,
  b.description,
  b.logo_url,
  b.city,
  b.zone,
  b.alcance,
  b.public_address,
  b.category_id,
  b.subcategory_id,
  b.is_featured,
  b.is_premium,
  b.premium_level,
  b.display_order,
  b.ranking_score,
  pl.level AS plan_level,
  CASE
    WHEN pl.level = 'pro' THEN 'PRO'
    WHEN pl.level = 'start' THEN 'START'
    ELSE NULL
  END AS badge,
  b.cta_phone,
  b.cta_email,
  b.cta_website,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekdays ELSE NULL END AS schedule_weekdays,
  CASE WHEN b.show_schedule = true THEN b.schedule_weekend ELSE NULL END AS schedule_weekend,
  -- Images: START gets 2, PRO gets 6, FREE gets none
  CASE
    WHEN b.show_gallery = false OR b.images IS NULL THEN NULL::text[]
    WHEN pl.level = 'pro' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 6) t)
    WHEN pl.level = 'start' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 2) t)
    ELSE NULL::text[]
  END AS images,
  -- WhatsApp: START + PRO
  CASE
    WHEN pl.level IN ('start', 'pro') AND b.show_whatsapp = true THEN b.cta_whatsapp
    ELSE NULL
  END AS cta_whatsapp,
  -- Social: START + PRO
  CASE
    WHEN pl.level IN ('start', 'pro') AND b.show_social = true THEN b.instagram_url
    ELSE NULL
  END AS instagram_url,
  CASE
    WHEN pl.level IN ('start', 'pro') AND b.show_social = true THEN b.facebook_url
    ELSE NULL
  END AS facebook_url,
  CASE
    WHEN pl.level IN ('start', 'pro') AND b.show_social = true THEN b.other_social_url
    ELSE NULL
  END AS other_social_url,
  b.claim_status
FROM businesses b
JOIN plan_level pl ON pl.id = b.id
WHERE b.is_active = true;