DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public AS
WITH plan_level AS (
  SELECT b.id,
    CASE
      WHEN b.trial_ends_at IS NOT NULL AND b.trial_ends_at > now() THEN 'pro'
      WHEN b.subscription_status = 'active' AND b.plan_id IS NOT NULL THEN COALESCE((SELECT cp.tier FROM commercial_plans cp WHERE cp.id = b.plan_id), 'free')
      WHEN b.subscription_status = 'active' AND b.is_premium = true THEN 'pro'
      ELSE 'free'
    END AS level
  FROM businesses b
)
SELECT b.id,
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
  CASE
    WHEN b.show_gallery = false OR b.images IS NULL THEN NULL::text[]
    WHEN pl.level = 'pro' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 6) t)
    WHEN pl.level = 'start' THEN (SELECT array_agg(t.img) FROM (SELECT unnest(b.images) AS img LIMIT 2) t)
    ELSE NULL::text[]
  END AS images,
  CASE WHEN pl.level IN ('start','pro') AND b.show_whatsapp = true THEN b.cta_whatsapp ELSE NULL END AS cta_whatsapp,
  CASE WHEN pl.level IN ('start','pro') AND b.show_social = true THEN b.instagram_url ELSE NULL END AS instagram_url,
  CASE WHEN pl.level IN ('start','pro') AND b.show_social = true THEN b.facebook_url ELSE NULL END AS facebook_url,
  CASE WHEN pl.level IN ('start','pro') AND b.show_social = true THEN b.other_social_url ELSE NULL END AS other_social_url,
  CASE WHEN pl.level = 'pro' THEN b.cta_booking_url ELSE NULL END AS cta_booking_url,
  CASE WHEN pl.level = 'pro' THEN b.cta_order_url ELSE NULL END AS cta_order_url,
  b.claim_status
FROM businesses b
JOIN plan_level pl ON pl.id = b.id
WHERE b.is_active = true;